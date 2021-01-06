const express = require('express');
const {body} = require('express-validator');

const router = express.Router();
const postController = require('../controllers/postController');

router.get('/posts', postController.getPosts);
router.get('/post/:postId', postController.getPost);

router.post('/post', [
	body('title')
		.trim()
		.isLength({min: 5, max: 90}).withMessage('Title should be between 5 to 90 characters.'),
	body('content')
		.trim()
		.isLength({min: 5}).withMessage('Content should be atleast 5 characters.'),

	], postController.createPost);

router.put('/post/:postId', [
	body('title')
		.trim()
		.isLength({min: 5, max: 90}).withMessage('Title should be between 5 to 90 characters.'),
	body('content')
		.trim()
		.isLength({min: 5}).withMessage('Content should be atleast 5 characters.'),

	], postController.updatePost);

router.delete('/post/:postId', postController.deletePost);

module.exports = router;