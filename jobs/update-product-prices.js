var log = require('loglevel');
var smartRequest = require('./smart-request')(1, null, null, disconnect);
var mongoose = require('mongoose'); 					// mongoose for mongodb
var Product  = require('./app/models/product');
var CW_PRICE_URL = 'http://www.chemistwarehouse.com.au/inc_product_updater_json_shortlive.asp?callback=getPrice&ID=';

// Configurations
var mongoUrl = 'mongodb://localhost:27017/renebuy'; //process.env.MONGOHQ_URL 
mongoose.connect(mongoUrl);
mongoose.set('debug', true);

log.setLevel('info');

function disconnect() {
	mongoose.disconnect();
}

Product.find().exec(function(err, products) {
	if (err) {log.error(err); return;}
		
	var total = products.length;
	var count = 1;
	
	log.info("Updating price for %d products...", total);
	
	products.forEach(function(product) {
		product.stores.forEach(function(store) {		
			if (store.storeName === 'Chemist warehouse') {			
				getChemistWarehousePrice(store.productId, function(price) {
					log.info("Got price $%d (previous $%d) for [%s] in [%s]", 
						price, store.prices[0], product.name, store.storeName);
				});
			} else if (store.storeName === 'Pharmacy online') {
				getPharmacyOnlinePrice(store.detailUrl, function(price) {
					log.info("Got price $%d (previous $%d) for [%s] in [%s]", 
						price, store.prices[0], product.name, store.storeName);
				});
			}
		});
	});
});

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

