var express  = require('express');
var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('./models/product');
var _ = require('underscore');

// configuration =================
var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/renebuy';

mongoose.connect(mongoUrl);
mongoose.set('debug', true)

function handleError(err, res) {
	console.error(err);
	var statusCode = err.statusCode || 503;
	var errorMessage = err.message || err;
	res.status(statusCode).send(errorMessage);
}

function handleResult(result, res) {
	console.log(result);
	res.json(result);
}

// configuration of the router
var router = express.Router();

router.route('/products')
.get(function(req, res) {
	Product.find(function(err, products) {
		if (err) {handleError(err, res); return;}
		handleResult(products, res);
	});
}).post(function(req, res) {
	console.log('Creating product: ', req.body);
	/* An example of the request body:
	{
		"name": "Some product",
		"store": "Chemist wharehouse",
		"price": 14.59,
		"rrp": 15.59,
		"detailUrl": "http://xxx.com/abcd.html",
		"productId": "12345",
		"photos": ["http://xxx.com/abc.jpg"]
	}
	*/
	
	Product.findOne({name: req.body.name}, function(err, product) {
		if (err) {handleError(err, res); return;}
		
		if (product) {
			for (var i = 0; i < product.stores.length; i++) {
				if (product.stores[i].storeName === req.body.store) {
					handleError({statusCode: 409, message: 'Product already exists for this store'}, res); 
					return;
				}
			}
		} else {
			product = new Product({name: req.body.name});
		}
		
		product.stores.push({
			storeName: req.body.store,
			productId: req.body.productId,
			detailUrl: req.body.detailUrl,
			prices: [req.body.price],
			rrp: req.body.rrp,
			lastUpdatedAt: new Date()
		});
		
		product.photos = _.union(product.photos, req.body.photos);
		
		product.save(function(err, savedProduct) {
			if(err) {handleError(err, res); return;}
			handleResult(savedProduct, res);
		});
	});
});

module.exports = router;