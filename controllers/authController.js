const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed. Entered data is invalid.');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}

	const name = req.body.name;
	const email = req.body.email;
	const password = req.body.password;

	bcrypt.hash(password, 12)
	.then(hashedPass => {
		const user = new User({
			name: name.toUpperCase(),
			email: email,
			password: hashedPass
		});
		return user.save();
	})
	.then( result => {
		res.status(201).json({ messge: 'User created!', userId: result._id})
	})
	.catch( err => {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	})
};