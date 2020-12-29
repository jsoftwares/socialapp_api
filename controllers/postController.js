const Post = require('../models/post');
const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');



exports.getPosts = (req, res, next) => {
	Post.find()
	.then( posts => {
		if (!posts) {
			const error = new Error('Posts cannot be found.');
			error.statusCode = 404;
			throw error; //transfers execution to catch()
		}

		res.status(200).json({
		message: 'Posts found!',
		posts: posts
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
			const error = new Error('Post cannot be found.');
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
	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imageUrl: '/images/course1.jpg',
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