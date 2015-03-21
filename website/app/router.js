var express  = require('express');
var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('./models/product');
var PriceAlert = require('./models/price-alert')
var Order = require('./models/order')
var Purchase = require('./models/purchase')
var Box = require('./models/box')
var _ = require('underscore');
var async = require('async');
var PriceCollector = require('./price-collector');


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
})
.get(function(req, res) {
	if (req.query.newPrice) {
		PriceCollector.collectPrices(req.params.id, function(err, newPriceMap) {
			if (err) return handleError(err, res);
			handleResult(newPriceMap, res);
		})
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
	cutoff.setDate(cutoff.getDate() - 7);
	
	PriceAlert.find({alertDate: {$gt: cutoff}}).populate('product', '-_id name nameInChinese photos').exec(function(err, result) {
		if(err) {handleError(err, res); return;}
		handleResult(result, res);
	})
});




/*******     ORDER      ********/

function updateProductSalesInfo(products, infoKey, res) {
	var results = [];
	async.each(products, function(product, callback) {

		Product.findById(product._id, function(err, p) {
			if (err) return callback(err);
			if (product.total !== undefined) {
				p.salesInfo[infoKey] = product.total;
			} else {
				p.salesInfo[infoKey] += product.diff;
			}
			
			p.save(function(err, updated) {
				if (err) return callback(err);
				results.push({id: updated._id, name: updated.name, salesInfo: updated.salesInfo});
				callback();
			});
		});
		
	}, function(err) {
		if (err) return handleError(err, res);
		handleResult({'status': 'ok', updating: infoKey, results: results}, res)
	});
}

router.route('/order')
.get(function(req, res) {
	if (req.query.activeName) {
		Order.find({status: 'active'}).sort('-createdDate').select('name').exec(function(err, result) {
			if (err) {handleError(err, res); return;}
			handleResult(result, res);
		});
	} else if (req.query.active) {
		Order.find({status: 'active'}).sort('-createdDate').populate('items.product', 'name nameInChinese photos salesInfo').exec(function(err, result) {
			if (err) {handleError(err, res); return;}
			handleResult(result, res);
		});
	} else if (req.query.shipping) {
		Order.find({status: 'shipping'}).sort('-createdDate').populate('items.product', 'name nameInChinese photos').exec(function(err, result) {
			if (err) {handleError(err, res); return;}
			handleResult(result, res);
		});
	} else if (req.query.shoppingList) {
		var projection = req.query.details ? 'name nameInChinese photos stores rrp salesInfo' : 'name stores rrp'
		
		Order.aggregate(
			{$match: {status: 'active'}},
			{$unwind: '$items'},
			{$group: {_id: '$items.product'}}, 
			function(err, productIds) {
				if (err) {handleError(err, res); return;}
				var ids = productIds.map(function(idObject) {return idObject._id;});
				console.log(ids);
				
				Product.find({_id: {$in: ids}}).select(projection).exec(function(err, shoppingList) {
					if (err) {handleError(err, res); return;}
					handleResult(shoppingList, res); 
				});
			});
	}
})
.post(function(req, res) {
	/* Sample order item request body
	{
		"productId": "xxxdfffff0011",
		"price": 120.99,
		"number": 2,
		"description": "To jia jia",
		"orderId": "ddfd1222xxxx",
		"newOrderName": "Lijiayi 20150119"   // Either orderId or newOrderName is needed
	}
	*/
	function updateProductOrderedQuantity() {
		Product.findById(req.body.productId, function(err, product) {
			if (err) return handleError(err, res);
			if (!product) return handleError("cannot find product", res);
			product.salesInfo.ordered += req.body.number;
			product.save(function(err) {
				if (err) return handleError(err, res);
				handleResult({'status': 'ok'}, res);
			});
		});
	}
	
	function saveOrderItem(order) {
		order.items.push({
			product: mongoose.Types.ObjectId(req.body.productId),
			price: req.body.price,
			number: req.body.number,
			description: req.body.description
		});
		
		order.save(function(err) {
			if (err) {handleError(err, res); return;}
			updateProductOrderedQuantity();
		});
	}
	
	if (req.body.orderId) {
		// find the order:
		Order.findById(req.body.orderId, function(err, order) {
			if (err) {handleError(err, res); return;}
			if (order) saveOrderItem(order);
		});
	} else if (req.body.newOrderName) {
		saveOrderItem(new Order({name : req.body.newOrderName}));
	}
});

router.route('/order/:orderId')
.post(function (req, res) {
	
	function updateSoldNumber(items) {
		var soldNumberMap = {};
		items.forEach(function(item) {
			soldNumberMap[item.product] = soldNumberMap[item.product] || 0;
			soldNumberMap[item.product] += item.number;
		});
		var soldProducts = [];
		_.each(soldNumberMap, function(sold, productId) {
			soldProducts.push({_id: productId, diff: sold});
		});
		console.log('sold products: ', soldProducts);
		updateProductSalesInfo(soldProducts, 'sold', res);
	}
	
	function shipOrder() {
		Order.findById(req.params.orderId, function(err, order) {
			if (err) return handleError(err, res);
			if (order) {
				order.status = 'shipping';
				order.save(function(err) {
					if (err) return handleError(err, res);
					updateSoldNumber(order.items);
				})
			}
		});
	}
	
	if (req.query.ship) {
		return shipOrder();
	}
	
	/* Update order items
	{ 	"deleted" : ["xxxxdf1432432"], 
	  	"udpated" : { 
		  "xxxddd111000" :
			{
				"price": 1.99,
				"number": 2,
				"description": "Some text"
			}
		}
	}
	*/
	var orderedAdjustments = {};
	
	function changeQuantity(productId, diff) {
		//console.log('change proudct: ', productId, diff);
		orderedAdjustments[productId] = orderedAdjustments[productId] || 0;
		orderedAdjustments[productId] += diff;
	}
	
	function getChangedProducts() {
		var products = [];
		//console.log(orderedAdjustments);
		_.each(orderedAdjustments, function(diff, productId) {
			//console.log('product ordered changed, %s, %d', productId, diff);
			products.push({_id: productId, diff: diff});
		});
		return products;
	}
	
	Order.findById(req.params.orderId, function(err, order) {
		if (err) {handleError(err, res); return;}
		if (order) {		
			order.items.forEach(function(item) {
				var newItem = req.body.updated[item._id];
				if (newItem) {
					changeQuantity(item.product, newItem.number - item.number);
					item.price = newItem.price;
					item.number = newItem.number;
					item.description = newItem.description;
				}
				//console.log('deleted items: ', item._id, req.body.deleted, req.body.deleted.indexOf(item._id.toString()));
				if (req.body.deleted.indexOf(item._id.toString()) > -1) {
					changeQuantity(item.product, -item.number);
				}
			});
			
			req.body.deleted.forEach(function(itemId) {
				order.items.pull(itemId);	
			});
			
			if(req.body.name !== order.name) {
				order.name = req.body.name;
			}
				
			order.save(function(err, result) {
				if (err) {handleError(err, res); return;}
				updateProductSalesInfo(getChangedProducts(), 'ordered', res);
			});
			
		}
	});
});

router.route('/purchase')
.post(function(req, res) {
	/*
	{
		"productId": "xxxyyy000111"
		"price": 2.99,
		"quantity": 3
	}
	*/	
	
	function updateProductBoughtQuantity() {
		Product.findById(req.body.productId, function(err, product) {
			if (err) return handleError(err, res);
			if (!product) return handleError("cannot find product", res);
			product.salesInfo.bought += req.body.quantity;
			product.save(function(err) {
				if (err) return handleError(err, res);
				handleResult({'status': 'ok'}, res);
			});
		});
	}
	
	new Purchase({
		product: mongoose.Types.ObjectId(req.body.productId),
		price: req.body.price,
		quantity: req.body.quantity
	}).save(function(err, savedPurchase) {
		if (err) return handleError(err, res);
		updateProductBoughtQuantity();	
	});
});

router.route('/box')
.post(function(req, res) {
	/* Create new box (boxId === 'new') or update box:
		{
			name: 'New box 1',
			trackingNumber: 'CDxxfd2tret'
			recipient: 'xxx',
			items: [
				{orderItemId: 'aaabbbccc', quantity: 2},
				{orderItemId: 'aaabbbcccdd', quantity: 1}
			]
		}
	*/
	new Box({
		name: req.body.name,
		trackingNumber: req.body.trackingNumber,
		recipient: req.body.recipient,
		items: req.body.items
	}).save(function(err, savedBox) {
		if (err) return handleError(err, res);
		handleResult(savedBox, res);
	});
})
.get(function (req, res) {
	Box.where('status').ne('received').exec(function(err, boxes) {
		if (err) return handleError(err, res);
		handleResult(boxes, res);
	});
});


router.route('/box/:boxId')
.post(function (req, res) {
	/* update box:
		{
			_id: 'xxxdfsdfdf232',
			name: 'New box 1',
			trackingNumber: 'CDxxfd2tret'
			recipient: 'xxx',
			items: [
				{orderItemId: 'aaabbbccc', quantity: 2},
				{orderItemId: 'aaabbbcccdd', quantity: 1}
			]
		}
	*/
	 Box.findById(req.params.boxId, function(err, box) {
	 	if (err) return handleError(err, res);
	 	if (box) {
	 		box.name = req.body.name;
	 		box.trackingNumber = req.body.trackingNumber;
	 		box.recipient = req.body.recipient;
	 		box.items = req.body.items;
	 		
	 		box.save(function(err, savedBox) {
	 			if (err) return handleError(err, res);
	 			handleResult(savedBox, res);
	 		});
	 	}
	 });
});

router.route('/calc-sales-info/:infoKey')
.get(function (req, res) {	
	if (req.params.infoKey === 'ordered') {
		// calculate ordered
		Order.aggregate(
			{$unwind: '$items'},
			{$group: {_id: '$items.product', total: {$sum: '$items.number'}}}, 
			function(err, products) {
				if (err) return handleError(err, res);
				updateProductSalesInfo(products, 'ordered', res);	
			}
		);
	} else if (req.params.infoKey === 'sold') {
		// calculate sold
		Order.aggregate(
			{$match: {status: {$ne : 'active'}}},
			{$unwind: '$items'},
			{$group: {_id: '$items.product', total: {$sum: '$items.number'}}}, 
			function(err, products) {
				if (err) return handleError(err, res);
				updateProductSalesInfo(products, 'sold', res);
			}
		);
	} else if (req.params.infoKey === 'bought') {
		// calculate bought
		Purchase.aggregate(
			{$group: {_id: '$product', total: {$sum: '$quantity'}}},
			function(err, products) {
				if (err) return handleError(err, res);
				updateProductSalesInfo(products, 'bought', res);
			}
		);
	} else if (req.params.infoKey === 'clean') {
		Product.update(
			{}, // query 
			{$set: {salesInfo: {ordered: 0, bought: 0, sold: 0}}}, // clean salesInfo
			{multi: true},  // update all
			function(err, updated) {
				if (err) return handleError(err, res);
				handleResult({'status': 'ok', updated: updated}, res);
			});
	} else {
		handleError('InfoKey should be one of [clean, ordered, sold, bought]', res);
	}
});

module.exports = router;