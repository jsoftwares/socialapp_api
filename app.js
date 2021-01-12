const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Mongoose = require('mongoose');
const multer = require('multer');
const {graphqlHTTP} = require('express-graphql');

const app = express();

const config = require('./util/development.json');
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

	next();
});

app.use('/graphql', graphqlHTTP({
	schema: graphqlSchema,
	rootValue: graphqlResolver,
	graphiql: true
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
