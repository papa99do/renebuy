var async = require('async');

var Order = require('../models/order');
var Box = require('../models/box');

var CJEXPRESS_URL = 'http://cjexpress-proxy.herokuapp.com/';

var BoxHandler = {};

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

BoxHandler.create = function(req, res) {
	/* Create new box:
		{
			name: 'Box 1'
			items: [
				{orderItemId: 'aaabbbccc', quantity: 2},
				{orderItemId: 'aaabbbcccdd', quantity: 1}
			]
		}
	*/
	new Box({
		name: req.body.name,
		items: req.body.items
	}).save(function(err, savedBox) {
		if (err) return handleError(err, res);
		handleResult(savedBox, res);
	});
};

BoxHandler.getBoxes = function (req, res) {
	Order.find({status: 'shipping'}).select('items').exec(function (err, orders) {
		if (err) return handleError(err, res);
		var itemIds = [];
		orders.forEach(function(order) {
			order.items.forEach(function(item) {
				itemIds.push(item._id);
			});
		});

		Box.where('items.orderItemId').in(itemIds).sort('_id').exec(function(err, boxes) {
			if (err) return handleError(err, res);
			handleResult(boxes, res);
		});
	});
};

BoxHandler.update = function (req, res) {
	Box.findById(req.params.boxId, function(err, box) {
		if (err) return handleError(err, res);
		if (!box) return handelError("No box found", res);

		if (req.query.ship) {
			box.shippedDate = req.body.dateShipped;
			box.trackingNumber = req.body.trackingNumber;
			box.recipient = req.body.recipient;
			box.status = 'shipped';
		} else if (req.query.receive) {
			box.receivedDate = req.body.dateReceived;
			box.status = 'received';
		} else {
			box.name = req.body.name;
			box.items = req.body.items;
		}

		box.save(function(err, savedBox) {
			if (err) return handleError(err, res);
			handleResult(savedBox, res);
		});
	});
};

BoxHandler.track = function (req, res) {
	Box.find({status: 'shipped'}, function (err, boxes){
		if (err) return handleError(err, res);

		var deliveryInfoMap = {};
		async.eachLimit(boxes, 3, function(box, callback) {
			request(CJEXPRESS_URL + box.trackingNumber, function(err, response, body) {
				if (err) return callback(err);
				var result = JSON.parse(body);
				if (result.status === 'ok') {
					deliveryInfoMap[box.trackingNumber] = result.history;
					box.deliveryInfo = result.history;
					box.deliveryUpdated = new Date();
					box.save(function(err, savedBox) {
						if (err) return callback(err);
						callback();
					});
				} else {
					callback();
				}

			});
		},
		function(err) {
			if (err) return handleError(err, res);
			handleResult(deliveryInfoMap, res);
		});
	});
};

module.exports = BoxHandler;
