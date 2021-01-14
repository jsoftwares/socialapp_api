const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Mongoose = require('mongoose');
const multer = require('multer');
const {graphqlHTTP} = require('express-graphql');

const app = express();

const config = require('./util/development.json');
const auth = require('./middleware/auth');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images")
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString().replace(/[-T:\.Z]/g,'-') + file.originalname);
	}
});
const fileFilter = (req, file, cb)=> {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
	}else{
		cb(null, false);
	}
}
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter:fileFilter }).single('image')); //.single('image') tells multer to extract a singel file stored in a field named IMAGE in d incoming request
// app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use( (req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE', 'OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	
	//This is ensure we get d expected error response since GraphQL blocks any req that's not GET or POST, OPTIONS
	//which is sent before our actual req would fail hence we will get that error instead of d actual error if we have any in our code
	//Note we returnd an empty response so that next() is not executed, hence OPTIONS req never makes it to d graphql endpoint but still gets a valid res
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});
app.use(auth);
app.use('/graphql', graphqlHTTP({
	schema: graphqlSchema,
	rootValue: graphqlResolver,
	graphiql: true,
	formatError(err) {
		//OriginalError will b set by GraphQL when it detects an error thrown in your code either by u or
		//a 3rd party package. A technical error eg missing a character in your GraphQL query will not set
		//originalError so we return err which is GraphQL default error.
		if (!err.originalError) {
			return err;
		}
		const data = err.originalError.data;
		const message = err.message || 'An error occured.';	//we can extract our msg directly on err bcos its already pulled out of error by graphql
		const code = err.originalError.code || 500;
		return {message:message, status:code, data:data};

	}
	})
);

app.use( (error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({message:message, data:data});
});

Mongoose.connect(config.mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true})
.then( result => {
	app.listen(process.env.PORT || 8080);
})
.catch( err => console.log(err));
