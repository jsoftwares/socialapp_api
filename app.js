const express = require('express');
const bodyParser = require('body-parser');
const Mongoose = require('mongoose');

const app = express();
const feedRoutes = require('./routes/feed');
const config = require('./util/development.json');

app.use(bodyParser.json());
app.use( (req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Acess-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	next();
});
app.use('/feed', feedRoutes);

Mongoose.connect(config.mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true})
.then( result => {
	app.listen(8080);
}).catch( err => console.log(err));
