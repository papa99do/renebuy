var log = require('loglevel');
var request = require('request');
var smartRequest = require('./smart-request')(1);

log.setLevel('info');

var GET_PRODUCTS_URL='http://localhost:3001/api/product?all=true';
var UPDATE_PRICE_URL='http://localhost:3001/api/product/';
var CW_PRICE_URL = 'http://www.chemistwarehouse.com.au/inc_product_updater_json_shortlive.asp?callback=getPrice&ID=';

smartRequest(GET_PRODUCTS_URL, {raw: true}, function(productsJson) {
	var products = JSON.parse(productsJson);
	
	log.info("Updating price for %d products...", products.length);
	
	products.forEach(function(product) {
		product.stores.forEach(function(store) {		
			if (store.storeName === 'CW') {			
				getChemistWarehousePrice(store.productId, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'PO') {
				getPharmacyOnlinePrice(store.detailUrl, function(price) {
					updatePrice(product, store, price);
				});
			}
		});
	});
});

function updatePrice(product, store, newPrice) {
	log.info("Got price $%d (was $%d) for [%s] in [%s]", 
		newPrice, store.price, product.name, store.storeName);
		
	if (newPrice !== store.price) {
		request.post({
			headers: {'content-type' : 'application/json'},
			url:     UPDATE_PRICE_URL + product._id + '?price=true',
			body:    JSON.stringify({store: store.storeName, newPrice: newPrice})
		}, function(error, response, body){
			if (error) {
				console.error('ERROR when updating price for [%s] in [%s] to $%d : %s', 
					product.name, store.storeName, newPrice, error);
			} else {
				console.log('Price updated for [%s] in [%s] to $%d ', 
					product.name, store.storeName, newPrice);
			}
		});
	}
}


function getPharmacyOnlinePrice(detailUrl, callback) {
	smartRequest(detailUrl, null, function($) {
		var price = $('.price').text();
		callback(parseFloat(price.substring(1)));
	});
}

function getChemistWarehousePrice(id, callback) {
	smartRequest(CW_PRICE_URL + id, {raw: true}, function(priceCallback) {
		if (priceCallback.indexOf("getPrice(") === 0) {
			var price = eval(priceCallback);
			callback(price);
		} else {
			log.error("Cannot find product with id ", id);
		}
	});
}

function getPrice(price) {
	return parseFloat(price[0].price.substring(1));
}

