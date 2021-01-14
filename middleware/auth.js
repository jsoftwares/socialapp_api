const jwt = require('jsonwebtoken');

const config = require('../util/development.json');

module.exports = (req, res, next) => {
	//get() is used to read headers from request stream
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		req.isAuth = false;
		return next(); //we return next() so that d control moves to d next middleware & d rest of this code in not executed
	}
	const token = authHeader.split(' ')[1];
	let decodedToken;
	try{
		decodedToken = jwt.verify(token, config.jwtSecret); //using verify() decodes & also verifies token validity as against decode()
	}catch( err){
		req.isAuth = false;
		return next();
	}

	if (!decodedToken) {
		req.isAuth = false;
		return next();
	}

	//If token is verified and validated, we want to add the userID to our request stream so that it 
	//would go into our graphql route when req successfully pass d middleware.
	req.userId = decodedToken.userId
	req.isAuth = true;
	next();
}