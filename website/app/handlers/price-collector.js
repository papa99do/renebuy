var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('../models/product');
var PriceAlert = require('../models/price-alert');
var async = require('async');
var request = require('request');
var cheerio = require('cheerio');

var CW_URL = 'http://www.chemistwarehouse.com.au';
var MC_URL = 'http://www.mychemist.com.au';
var WW_URL = 'https://www.woolworths.com.au/apis/ui/product/detail/'

function extractPrice(text, pattern) {
	var pattern = pattern || /\$([0-9.]+)/;
    var result = text.match(pattern);
    if (result && result.length > 1) {
    	return Number(result[1]);
    }
	return null;
}

function getCWPrice(store, withNewPrice) {
	request(store.detailUrl, function(err, response, html) {
		if (err) return withNewPrice(err);
		var newPrice = extractPrice(cheerio.load(html)('[itemprop=price]').text());
		if (!newPrice) {
			console.error("Cannot extract price from: ", html);
			return withNewPrice(null, store.price);
		}
		//console.log("new price: ", newPrice);
		withNewPrice(null, newPrice);
	});
}

function getOldPrice(store, withNewPrice) {
	withNewPrice(null, store.price);
}

function getPricelinePrice(store, withNewPrice) {
	request(store.detailUrl, function(err, response, html) {
		if (err) return withNewPrice(err);
		var price = cheerio.load(html)('.basket-right-price').text();
		//console.log('Priceline new price: ', price);
		if (price.indexOf('NOW') >= 0) {
			price = price.substring(price.indexOf('NOW'));
		}
		withNewPrice(null, extractPrice(price));
	});
}

function getWoolwoothsPrice(store, withNewPrice) {
	request(WW_URL + store.productId, function(err, response, json) {
		if (err) return withNewPrice(err);
		var price = JSON.parse(json).Product.Price;
		withNewPrice(null, price);
	});
}

function getPriceInPriceClassSpan(store, withNewPrice) {
	if (!store.detailUrl) {
		console.log('Detail Url is missing.');
		return withNewPrice(null, store.price);
	}
	request(store.detailUrl, function(err, response, html) {
		if (err) return withNewPrice(err);
		var price = cheerio.load(html)('.price').text();
		//console.log('new price for %s, %s', store.storeName, price);
		withNewPrice(null, extractPrice(price));
	});
}

var getPriceFunctionMap = {
	'CW': getCWPrice,
	'MC': getOldPrice,
	'PL': getPricelinePrice,
	'PO': getPriceInPriceClassSpan,
	'WW': getWoolwoothsPrice,
	'CO': getPriceInPriceClassSpan,
	'JJ': getPriceInPriceClassSpan
}

function getNewPrice(newPriceMap, store, callback) {
	var getPriceFunction = getPriceFunctionMap[store.storeName];
	if (getPriceFunction) {
		getPriceFunction(store, function(err, newPrice) {
			if (err) return callback(err);
			if (newPrice !== store.price) {
				newPriceMap[store.storeName] = {newPrice: newPrice, oldPrice: store.price};
				store.price = newPrice;
				if (store.lowestPrice > newPrice) {
					store.lowestPrice = newPrice;
				}
			}
			callback();
		})
	} else {
		callback();
	}
}

/**
 * @param productId
 * @param allDoneCallback function(err, newPriceMap) {}
 */
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
