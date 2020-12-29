const Post = require('../models/post');


exports.getPosts = (req, res, next) => {
	res.status(200).json({
		posts: [
			{
				_id: '1',
				title: 'Jeffrey\'s Blog',
				content: 'This is a super post describing my big Tech blog. Corner for the best IT professionals',
				imageUrl: 'images/duck.jpg',
				creator: { name: 'Jeffrey Onochie'},
				createdAt: new Date()
			},
			{	_id: '2',
				title: 'The mights of programming',
				content: 'A simple article to get you up and running with some critical information for programmers',
				imageUrl: 'images/duck.jpg',
				creator: { name: 'ND Aduba'},
				createdAt: new Date('2020-12-25')
			}
		]
	});
};

exports.createPost = (req, res, next) => {
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
	.catch( err => console.log(err));
}