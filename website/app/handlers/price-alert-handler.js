var mongoose = require('mongoose');
var PriceAlert = require('../models/price-alert')

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

	PriceAlert.find({alertDate: {$gt: cutoff}}).populate('product', '-_id name nameInChinese photos').exec(function(err, result) {
		if(err) {handleError(err, res); return;}
		handleResult(result, res);
	})
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
