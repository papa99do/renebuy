var express  = require('express');
var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('./models/product');
var PriceAlert = require('./models/price-alert')
var _ = require('underscore');

// configuration =================
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';
var DEFAULT_PAGE_SIZE = 20;

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

function splitCategory(category) {
	return category ? category.split('>').map(function(val) {return val.trim();}) : [];
}

// configuration of the router
var router = express.Router();

router.route('/category').get(function(req, res) {
	Product.find().select('category').exec(function(err, products) {
		if (err) {handleError(err, res); return;}
		var categoryTreeRootNode = {name: 'All categories', children: []};
		
		function findChild(parentNode, name) {
			for (var i = 0; i < parentNode.children.length; i++) {
				if (parentNode.children[i].name == name) {
					return parentNode.children[i];
				}
			}
			
			return null;
		}
		
		products.forEach(function(product) {
			var fullName = '', treeNode = categoryTreeRootNode;
			
			product.category.forEach(function (c) {
				var node = findChild(treeNode, c);
				fullName = fullName ? fullName + '>' + c : c;
				if (!node) {
					node = {name: c, fullName: fullName, count: 1, children: []};
					treeNode.children.push(node);
				} else {
					node.count++;
				}
				treeNode = node;
			});
		});
		
		handleResult(categoryTreeRootNode.children, res);
	});
});

router.route('/product')
.get(function(req, res) {
	
	function returnProducts(err, products) {
		if (err) {handleError(err, res); return;}
		handleResult(products, res);
	}
	
	var page = req.query.p ? parseInt(req.query.p) : 0;
	var pageSize = req.query.ps ? parseInt(req.query.ps) : DEFAULT_PAGE_SIZE;
	
	if (req.query.q && req.query.q.indexOf('c:') === 0) {
		// search by category
		var category = req.query.q.substring(2).trim();
		Product.find({category: category}).skip(page * pageSize).limit(pageSize + 1).exec(returnProducts);
		
	} else if (req.query.q) {
		// search by term	
		var opt = req.query.sm ? { /* used by similar product */
			project : 'name nameInChinese category weight isHighTax',
			limit: 3
		} : { /* used by search */
			limit: (page + 1) * pageSize + 1
		};
		
		Product.textSearch(req.query.q, opt, function(err, result) {
			if (err) {handleError(err, res); return;}
			var productsWithScore = req.query.sm ? result.results : result.results.slice(page * pageSize);
			var products = productsWithScore.map(function(value) {return value.obj;});
			handleResult(products, res);
		});
		
	} else if (req.query.all) {
		/* used by update price */
		Product.find().select('name stores rrp').exec(returnProducts);
		
	} else if (req.query.suggest) {
		/* used by search suggestion */
		Product.find().select('-_id name nameInChinese').exec(returnProducts);
		
	} else if (req.query.category) { /* used by price list */
		var categories = splitCategory(req.query.category);
		//console.log('Search by category: ', categories);
		Product.find({category: {$all: categories}}).exec(returnProducts);
		
	} else {
		/* used by default search */
		console.log('Retrieving products, page: %d, pageSize: %d', page, pageSize);
		Product.find().sort({'_id': -1}).skip(page * pageSize).limit(pageSize + 1).exec(returnProducts);
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
		"isHighTax": true,
		"nameInChinese": "神奇碗"
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
				isHighTax: req.body.isHighTax,
				nameInChinese: req.body.nameInChinese
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
			/* {"weight": 200} */
			updateWeight(product);
		} else if (req.query.category) {
			/* {"category": "Category1 > Category2 > Category3"} */
			updateCategory(product);
		} else if (req.query.price) {
			/* {"store": "CW", "price": 2.99} */
			updateStorePrice(product);
		} else if (req.query.adjustPrice) {
			/* {"adjustedPrice": 2.99} */
			updateAdjustedPrice(product);
		} else if (req.query.nameInChinese) {
			/* {"nameInChinese": "好东西"} */
			updateNameInChinese(product);
		} else if (req.query.name) {
			/* {"name": "some new name"} */
			updateName(product);
		} else if (req.query.taxType) {
			/* {"isHighTax": true} */
			updateTaxType(product);
		}
	});
	
	function updateTaxType(product) {
		product.isHighTax = req.body.isHighTax;
		saveProduct(product);
	}
	
	function updateName(product) {
		product.name = req.body.name;
		saveProduct(product);
	}
	
	function updateNameInChinese(product) {
		product.nameInChinese = req.body.nameInChinese;
		saveProduct(product);
	}
	
	function updateAdjustedPrice(product) {
		product.adjustedPrice = req.body.adjustedPrice;
		saveProduct(product);
	}
	
	function updateWeight(product) {
		product.weight = req.body.weight;
		saveProduct(product);
	}
	
	function updateCategory(product) {
		product.category = req.body.category ? req.body.category.split('>')
			.map(function(val) {return val.trim();}) : [];
		saveProduct(product);
	}
	
	function updateStorePrice(product) {
		for (var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === req.body.store) {
				product.stores[i].price = req.body.price;
				if (req.body.price < product.stores[i].lowestPrice) {
					product.stores[i].lowestPrice = req.body.price;
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

router.route('/price-alert')
.post(function(req, res) {
	PriceAlert.create({
		product: mongoose.Types.ObjectId(req.body.productId),
		store: req.body.store,
		oldPrice: req.body.oldPrice,
		newPrice: req.body.newPrice,
		rrp: req.body.rrp,
		alertType: req.body.alertType
	}, function(err, createdPriceAlert) {
		if(err) {handleError(err, res); return;}
		handleResult(createdPriceAlert, res);
	})
})
.get(function(req, res) {
	var cutoff = new Date();
	cutoff.setDate(cutoff.getDate()-7);
	
	PriceAlert.find({alertDate: {$gt: cutoff}}).populate('product', '-_id name nameInChinese photos').exec(function(err, result) {
		if(err) {handleError(err, res); return;}
		handleResult(result, res);
	})
})
;

module.exports = router;