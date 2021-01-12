const bcrypt = require('bcryptjs');


const User = require('../models/user');

module.exports = {
	createUser: async function(args, req){
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