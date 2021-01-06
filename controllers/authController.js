const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const config = require('../util/development.json');

exports.signup = async (req, res, next) => {
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

	try{
		const hashedPass = await bcrypt.hash(password, 12);
	
		const user = new User({
			name: name.toUpperCase(),
			email: email,
			password: hashedPass
		});
		await user.save();
		res.status(201).json({ messge: 'User created!', userId: user._id});

	}catch( err ){
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.login = async (req, res, next) => {

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed.');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}

	const email = req.body.email;
	const password = req.body.password;
	
	try{
		const user = await User.findOne({email:email});
	
		if (!user) {
			const error = new Error('Invalid email or password.');
			error.statusCode = 401;
			throw error;
		}
		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = new Error('Invalid email or password.');
			error.statusCode = 401;
			throw error;
		}
	
		const token = jwt.sign(
			{email:user.email, userId: user._id.toString()},
			config.jwtSecret,
			{ expiresIn: '1h'}
		);

		res.status(200).json({token: token, userId: user._id.toString()});
	}catch( err){
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};