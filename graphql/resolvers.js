const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
config = require('../util/development.json');

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

	},

	login: async function({email, password}){
		const user = await User.findOne({email:email.toLowerCase()});
		if (!user) {
			const error = new Error('Email/password is incorrect.');
			errors.code = 401;
			throw error;
		}

		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = new Error('Email or password is incorrect.');
			error.code = 401;
			throw error;
		}

		const token = jwt.sign({
			userId: user._id.toString(),
			email: user.email
		}, config.jwtSecret, {expiresIn: '1hr'});

		return {token: token, userId:user._id.toString()};
	},

	createPost: async function({ postInput }, req) {
		//authentication

		if (!req.isAuth) {
			const error = new Error('Unauthenticated.')
			error.code = 401;
			throw error;
		}
		//validation
		const errors = [];
		if (!validator.isLength(postInput.title, {min:5})) {
			errors.push({message: 'Title must have at least 5 characters.'})
		}
		if (!validator.isLength(postInput.content, {min:5})) {
			errors.push({message: 'Content must have at least 5 characters.'})
		}
		if (errors.length > 0) {
			const error = new Error('Invalid input.');
			error.data = errors;
			error.code = 422;
			throw error;
		}
		const user = await User.findById(req.userId);	//we add userId to req in auth middleware
		if (!user) {
			const error = new Error('Invalid user.');
			error.data = errors;
			error.code = 401;
			throw error;
		}

		const post = new Post({
			title: postInput.title,
			content: postInput.content,
			imageUrl: postInput.imageUrl,
			creator: user
		});

		const createdPost = await post.save();
		user.posts.push(createdPost);
		await user.save();

		return {...createdPost._doc, _id: createdPost._id.toString(), 
			createdAt: createdPost.createdAt.toISOString(), updatedAt:createdPost.updatedAt.toISOString()
		};
	},

	posts: async function({page}, req) {
		if (!req.isAuth) {
			const error = new error('Unauthenticated');
			error.code = 401;
			throw error;
		}
		if (!page) {
			page
		}

		const perPage = 2;

		const totalPosts = await Post.find().countDocuments();
		const posts = await Post.find().populate('creator')
		.skip((page - 1) * perPage).limit(perPage).sort({'createdAt': -1});

		return {
			posts: posts.map(p => {
				return {
		          ...p._doc,
		          _id: p._id.toString(),
		          createdAt: p.createdAt.toISOString(),
		          updatedAt: p.updatedAt.toISOString()
		        };
		    }),
			totalPosts: totalPosts
		};
	}


}