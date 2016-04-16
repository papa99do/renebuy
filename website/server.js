// set up ========================
var express  = require('express');
var app      = express(); 								// create our app w/ express
var morgan = require('morgan'); 			// log requests to the console (express4)
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var mongoose = require('mongoose');
var router = require('./app/router');
var cors = require('cors');

app.use(express.static(__dirname + '/public')); 				// set the static files location /public/img will be /img for users
app.use(morgan('dev')); 										// log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); 			// parse application/x-www-form-urlencoded
app.use(bodyParser.json()); 									// parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());

// configuration =================
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';

mongoose.connect(mongoUrl);
mongoose.set('debug', true);

// set up routing
app.use('/api', router);

app.get('*', function(req, res) {
	res.sendfile('public/index.html');
});

// listen (start app with node server.js) ======================================
var port = process.env.PORT || 3001;
app.listen(port);
console.log("App listening on port " + port);
