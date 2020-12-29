const express = require('express');
const {body} = require('express-validator');

const router = express.Router();
const postController = require('../controllers/postController');

router.get('/posts', postController.getPosts);

router.post('/post', [
	body('title')
		.trim()
		.isLength({min: 10, max: 90}).withMessage('Title should be between 10 to 90 characters.'),
	body('content')
		.trim()
		.isLength({min: 10}).withMessage('Content should be atleast 10 characters.'),

	], postController.createPost);

router.get('/post/:postId', postController.getPost)
module.exports = router;