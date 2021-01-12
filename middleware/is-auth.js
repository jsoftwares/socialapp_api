const jwt = require('jsonwebtoken');

const config = require('../util/development.json');

module.exports = (req, res, next) => {
	//get() is used to read headers from request stream
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Unauthorized.');
		throw error;
	}
	const token = authHeader.split(' ')[1];
	let decodedToken;
	try{
		decodedToken = jwt.verify(token, config.jwtSecret); //using verify() decodes & also verifies token validity as against decode()
	}catch( err){
		err.statusCode = 500;
		throw err;
	}

	if (!decodedToken) {
		const error = new Error('Unauthorized.')
		error.statusCode = 401;
		throw error;
	}

	//If token is verified and validated, we want to add the userID to our request stream so that it 
	//would go into our route when d middleware was passed. It can b useful when validating a DEL or update request to ensure post belongs to that user.
	req.userId = decodedToken.userId
	next();
}