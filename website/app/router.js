var express  = require('express');
var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('./models/product');
var _ = require('underscore');

// configuration =================
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';

mongoose.connect(mongoUrl);
mongoose.set('debug', true);

function handleError(err, res) {
	console.error(err);
	var statusCode = err.statusCode || 503;
	var errorMessage = err.message || err;
	res.status(statusCode).send(errorMessage);
}

function handleResult(result, res) {
	//console.log(result);
	res.json(result);
}

// configuration of the router
var router = express.Router();

router.route('/product')
.get(function(req, res) {
	
	if (req.query.q) {
		var opt = req.query.sm ? {
			project : 'name category weight isHighTax',
			limit: 3
		} : {
			limit: 10
		};
		
		Product.textSearch(req.query.q, opt, function(err, result) {
			if (err) {handleError(err, res); return;}
			console.log(result);
			var products = result.results.map(function(value) {return value.obj;});
			handleResult(products, res);
		});
	} else if (req.query.all) {
		
		Product.find().select('name stores').exec(function(err, products) {
			if (err) {handleError(err, res); return;}
			handleResult(products, res);
		});
		
	} else {
		Product.find().limit(16).exec(function(err, products) {
			if (err) {handleError(err, res); return;}
			handleResult(products, res);
		});
	}
}).post(function(req, res) {
	console.log('Creating product: ', req.body);
	/* An example of the request body:
	{
		"id": "DD03FFXXXX"  // optional, if user try to add price to a existing product
		"name": "Some product",
		"store": "CW",
		"price": 14.59,
		"rrp": 15.59,
		"detailUrl": "http://xxx.com/abcd.html",
		"productId": "12345",
		"photos": ["http://xxx.com/abc.jpg"]
		"category": "Category1 > Category2 > Category3",
		"weight": 300,  // 300g
		"isHighTax": true
	}
	*/
	
	var query = req.body.id ? {_id: req.body.id} : {name: req.body.name};
	
	Product.findOne(query, function(err, product) {
		if (err) {handleError(err, res); return;}
		
		if (product) {
			for (var i = 0; i < product.stores.length; i++) {
				if (product.stores[i].storeName === req.body.store) {
					handleError({statusCode: 409, message: 'Product already exists for this store'}, res); 
					return;
				}
			}
		} else {
			var categories = req.body.category ? req.body.category.split('>')
				.map(function(val) {return val.trim();}) : [];
				
			product = new Product({
				name: req.body.name, 
				rrp: req.body.rrp, 
				category: categories,
				weight: req.body.weight,
				isHighTax: req.body.isHighTax
			});
		}
		
		product.stores.push({
			storeName: req.body.store,
			productId: req.body.productId,
			detailUrl: req.body.detailUrl,
			price: req.body.price,
			lowestPrice: req.body.price
		});
		
		product.photos = _.union(product.photos, req.body.photos);
		
		product.save(function(err, savedProduct) {
			if(err) {handleError(err, res); return;}
			handleResult(savedProduct, res);
		});
	});
});

router.route('/product/:id')
.post(function(req, res) {
	console.log('Updating product: ', req.query, req.body);
	
	Product.findById(req.params.id, function(err, product) {
		if (err) {handleError(err, res); return;}
		if (!product) {handleError('Product not found', res); return;}
		
		if (req.query.weight) {
			/* {"newWeight": 200} */
			updateWeight(product);
		} else if (req.query.category) {
			/* {"newCategory": "Category1 > Category2 > Category3"} */
			updateCategory(product);
		} else if (req.query.price) {
			/* {"store": "CW", newPrice: 2.99} */
			updateStorePrice(product);
		} else if (req.query.priceAdjustment) {
			/* {"newPriceAdjustment": 2} */
			updatePriceAdjustment(product);
		}
	});
	
	function updatePriceAdjustment(product) {
		product.priceAdjustment = req.body.newPriceAdjustment;
		saveProduct(product);
	}
	
	function updateWeight(product) {
		product.weight = req.body.newWeight;
		saveProduct(product);
	}
	
	function updateCategory(product) {
		product.category = req.body.newCategory ? req.body.newCategory.split('>')
			.map(function(val) {return val.trim();}) : [];
		saveProduct(product);
	}
	
	function updateStorePrice(product) {
		for (var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === req.body.store) {
				product.stores[i].price = req.body.newPrice;
				if (req.body.newPrice < product.stores[i].lowestPrice) {
					product.stores[i].lowestPrice = req.body.newPrice;
				}
				
				saveProduct(product);
				
				break;		
			}
		}
	}
	
	function saveProduct(product) {
		product.save(function(err, savedProduct) {
			if(err) {handleError(err, res); return;}
			handleResult(savedProduct, res);
		});
	}
});

module.exports = router;