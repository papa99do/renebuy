var mongoose = require('mongoose'); 					// mongoose for mongodb
var async = require('async');
var request = require('request');
var cheerio = require('cheerio');

var Product  = require('../models/product');
var stores = require('../../common/store-price-helper').stores;

function getNewPrice(newPriceMap, store, callback) {
	var storeEx = stores[store.storeName] || {};
	if (!storeEx.priceExtractor) {
		return callback('No price extractor for store ' + storeEx.name);
	}

	var priceUrl = storeEx.priceUrlGenerator && storeEx.priceUrlGenerator(store) || store.detailUrl;
	//console.log('Url for store %s: %s', storeEx.name, priceUrl);

	request(priceUrl, function(err, response, body) {
		if (err) return callback(err);
		var newPrice = storeEx.priceExtractor(body);
		if (!newPrice) return callback('Cannot find price for store ' + storeEx.name);

		if (newPrice !== store.price) {
			newPriceMap[store.storeName] = {newPrice: newPrice, oldPrice: store.price};
			store.price = newPrice;
			if (store.lowestPrice > newPrice) {
				store.lowestPrice = newPrice;
			}
		}
		callback();
	});
}

function collectPrices(productId, allDoneCallback) {
	console.log('fetching product: ', productId);

	Product.findById(productId, 'stores', function(err, product) {
		if (err) return allDoneCallback && allDoneCallback(err);
		if (!product) return allDoneCallback && allDoneCallback('product not found');

		var newPriceMap = {};

		async.each(product.stores, function(store, callback) {
			getNewPrice(newPriceMap, store, callback);
		}, function (err) {
			if (err) return allDoneCallback && allDoneCallback(err);
			product.save(function(err) {
				allDoneCallback && allDoneCallback(null, newPriceMap);
			});
		});
	});
}

module.exports = {
	collectPrices: collectPrices
};
