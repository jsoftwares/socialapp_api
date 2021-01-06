const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/authController');

const router = express.Router();

router.put('/signup', [
	body('email')
		.isEmail().withMessage('Enter a valid E-mail')
		.custom( (value, {req}) => {
			return User.findOne({ email: req.email})
			.then( userDoc => {
				if (userDoc) {
					return Promise.reject('E-mail address already in use.');
				}
			})
		})
		.normalizeEmail(),
	body('password').trim().isLength({min:5}).withMessage('Password must be at least 5 characters.'),
	body('name').trim().not().isEmpty()
], authController.signup);

module.exports = router;