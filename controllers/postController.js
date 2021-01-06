const Post = require('../models/post');
const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');

const deleteImage = filePath => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, err => console.log(err));
}

exports.getPosts = (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;	//2 has also been set in frondend as required for this purpose. 
	let totalItems;
	Post.find().countDocuments()
	.then( count => {
		totalItems = count;
		return Post.find().skip((currentPage - 1) * perPage).limit(perPage);
	})
	.then( posts => {
			if (!posts) {
				const error = new Error('Posts cannot be found.');
				error.statusCode = 404;
				throw error; //transfers execution to catch()
			}

			res.status(200).json({
			message: 'Posts found!',
			posts: posts,
			totalItems: totalItems
		});
	})
	.catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	});
};

exports.getPost = (req, res, next) => {
	const postId = req.params.postId;

	Post.findById(postId)
	.then( post => {
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({
			message: 'Post found!',
			post: post
		})
	}).catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	});
}

exports.createPost = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed. Entered data is invalid.');
		error.statusCode = 422;
		error.errors = errors.array();
		throw error;	//exits this function execution if an error exist
	}

	if (!req.file) {
		const error = new Error('No image provided');
		error.statusCode = 422;
		throw error;
	}
	const imageUrl = req.file.path.replace('\\', '/');
	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imageUrl: imageUrl,
		creator: {name: 'Jeffrey Onochie'},
	});
	post.save()
	.then( result => {
		res.status(201).json({
			post: result,
			message: 'Post created successfully!'
		})
	})
	.catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	});
};

exports.updatePost = (req, res, next) => {
	const postId = req.params.postId;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed. Entered data is invalid.');
		error.statusCode = 422;
		error.errors = errors.array();
		throw error;	//exits this function execution if an error exist
	}

	const title = req.body.title;
	const content = req.body.content;
	const imageUrl = req.body.image;	//received from frondend if no new file is picked
	if (req.file) {
		imageUrl = req.file.path;	//use new image if one was picked in frontend
	}
	if (!imageUrl) {
		const error = new Error('No image was picked.');
		error.statusCode = 422;
		throw error;
	}

	Post.findById(postId)
	.then( post => {
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}

		if (imageUrl !== post.imageUrl) {
			deleteImage(post.imageUrl);
		}

		post.title = title;
		post.content = content;
		post.imageUrl = imageUrl;
		return post.save();
	}).then( result => {
		res.status(200).json({
			post: result,
			message: 'Post updated!'
		});
	})
	.catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	});

};

exports.deletePost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
	.then( post => {
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}

		//Check if post was created by logged in user
		deleteImage(post.imageUrl);
		return Post.findByIdAndRemove(postId)
		.then( result => {
			res.status(200).json({
				message: 'Post deleted.'
			})
		})
	}).catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	});
};