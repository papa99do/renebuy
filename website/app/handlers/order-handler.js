var mongoose = require('mongoose');
var _ = require('underscore');
var async = require('async');

var Order = require('../models/order');
var Product  = require('../models/product');
var Purchase = require('../models/purchase');

var OrderHandler = {};

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

OrderHandler.getOrders = function(req, res) {
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
	} else if (req.query.shippingWithPolarExpress) {
		Order.find({status: 'shipping'}).sort('-createdDate').populate('items.product', 'name nameInChinese polarCategory').exec(function(err, result) {
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
};

OrderHandler.create = function(req, res) {
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
};

OrderHandler.update = function (req, res) {

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

	function fulfillOrder() {
		Order.findById(req.params.orderId, function(err, order) {
			if (err) return handleError(err, res);
			if (order) {
				order.status = 'fulfilled';
				order.save(function(err, updatedOrder) {
					if (err) return handleError(err, res);
					handleResult(updatedOrder, res);
				})
			}
		});
	}

	if (req.query.ship) {
		return shipOrder();
	} else if (req.query.fulfill) {
		return fulfillOrder();
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
};

OrderHandler.purchase = function(req, res) {
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
};

OrderHandler.calcSalesInfo = function (req, res) {
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
};

module.exports = OrderHandler;
