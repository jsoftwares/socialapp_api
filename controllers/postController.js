const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');

const io = require('../socket');	//this would already have been initialize in app.js by the time d req gets here
const Post = require('../models/post');
const User = require('../models/user');


const deleteImage = filePath => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, err => console.log(err));
}

exports.getPosts = async (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;	//2 has also been set in frondend as required for this purpose. 

	try{
		const totalItems = await Post.find().countDocuments();
		const posts = await Post.find().populate('creator').sort({createdAt: -1})
		.skip((currentPage - 1) * perPage).limit(perPage);

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
	}catch(err){
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPost = async (req, res, next) => {
	const postId = req.params.postId;

	try{
		const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({
			message: 'Post found!',
			post: post
		});
	}catch( err){
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.createPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed. Entered data is invalid.');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;	//exits this function execution if an error exist and sends control to the catch block
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
		creator: req.userId	//userId key was set in--auth middleware during JWT authentication
	});

	try{
		await post.save();
		const user = await User.findById(req.userId);
		user.posts.push(user);	//add the ID of the user to the user's posts array
		await user.save();

		//Emit an event to all active users on the all posts page.
		io.getIO().emit('posts', {action: 'create', post: {...post, creator:{_id:req.userId, name: user.name}}});

		res.status(201).json({
			message: 'Post created successfully!',
			post: post,
			creator: {_id: user._id, name: user.name}
		});
	}catch( err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.updatePost = async (req, res, next) => {
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

	try{
		const post = await Post.findById(postId).populate('creator');
	
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}
	
		if (post.creator._id.toString() !== req.userId) {
			const error = new Error('Unauthorized.');
			error.statusCode = 403;
			throw error;
		}
	
		if (imageUrl !== post.imageUrl) {
			deleteImage(post.imageUrl);
		}
	
		post.title = title;
		post.content = content;
		post.imageUrl = imageUrl;
		await post.save();
	
		io.getIO().emit('posts', {action: 'update', post:post});
		res.status(200).json({
			post: post,
			message: 'Post updated!'
		});
	}catch( err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}

};

exports.deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	try{
		const post = await Post.findById(postId)
	
		if (!post) {
			const error = new Error('Post not found.');
			error.statusCode = 404;
			throw error;
		}
	
		//Check if post was created by logged in user
		if (post.creator.toString() !== req.userId) {
			const error = new Error('Unauthorized.');
			error.statusCode = 403;
			throw error;
		}
	
		deleteImage(post.imageUrl);
		await Post.findByIdAndRemove(postId);	
	
		const user = await User.findById(req.userId);
	
		user.posts.pull(postId);
		await user.save();
	
		res.status(200).json({message: 'Post deleted.'});
	}catch( err ) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};