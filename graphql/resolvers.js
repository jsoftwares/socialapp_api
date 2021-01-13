const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

module.exports = {
	createUser: async function(args, req){
		let errors = [];
		if (!validator.isLength(args.userInput.name, {min:3})) {
			errors.push({message: 'Name must be minumum of 3 character.'});
		}
		if (!validator.isEmail(args.userInput.email)) {
			errors.push({message: 'Invalid email.'});
		}
		if (validator.isEmpty(args.userInput.password) || !validator.isLength(args.userInput.email, {min:5})) {
			errors.push({message: 'Password must be minumum of 5 character'})
		}

		if (errors.length > 0) {
			const error = new Error('Invalid input.');
			error.data = errors;
			error.code = 422;
			throw error;
		}

		const existingUser = await User.findOne({email: args.userInput.email});
		if (existingUser) {
			const error = new Error('Email already taken.');
			throw error;
		}

		const hashedPw = await bcrypt.hash(args.userInput.password, 12);
		const user = new User({
			name: args.userInput.name.toUpperCase(),
			email: args.userInput.email.toLowerCase(),
			password: hashedPw
		});

		const createdUser = await user.save();

		return {...createdUser._doc, _id:createdUser._id.toString()};

	}
}