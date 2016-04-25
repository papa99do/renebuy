var mongoose = require('mongoose');
var PriceAlert = require('../models/price-alert');
var Product = require('../models/product');

var PriceAlertHandler = {};

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

PriceAlertHandler.getRecentAlerts = function(req, res) {
	var cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - 7);

	PriceAlert.aggregate([
		{$match: {alertDate: {$gt: cutoff}}},
		{$group: {_id: '$product', stores: {$push:
			{name: '$store', oldPrice: '$oldPrice', newPrice: '$newPrice', alertType: '$alertType', alertDate: '$alertDate'}}}},
		{$project: {product: '$_id', stores: 1, _id: 0}}
	]).exec(function(err, result) {
		if(err) return handleError(err, res);
		Product.populate(result, {path: 'product', select: '-_id name nameInChinese photos'}, function(err, populated) {
			if (err) return handleError(err, res);
			handleResult(result, res);
		});
	});
};

PriceAlertHandler.create = function(req, res) {
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
};

module.exports = PriceAlertHandler;
