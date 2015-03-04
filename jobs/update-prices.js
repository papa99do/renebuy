var log = require('loglevel');
var request = require('request');

log.setLevel('info');

//var RENEBUY_URL = 'http://localhost:3001'
var RENEBUY_URL = 'http://renebuy.yihanzhao.com'

var ALL_PRODUCTS_URL= RENEBUY_URL + '/api/product?all=true';
var SHOPPING_LIST_PRODUCT_URL= RENEBUY_URL + '/api/order?shoppingList=true';
var UPDATE_PRICE_URL= RENEBUY_URL + '/api/product/';
var PRICE_ALERT_URL = RENEBUY_URL + '/api/price-alert/'
var CW_PRICE_URL = 'http://www.chemistwarehouse.com.au/inc_product_updater_json_shortlive.asp?callback=getPrice&ID=';
var MC_PRICE_URL = 'http://www.mychemist.com.au/inc_product_updater_json_shortlive.asp?callback=getPrice&ID=';

var dryRun = false;
var InShoppingList = false;
var parallelConnections = 5;

function getProductsUrl() {
	return InShoppingList ? SHOPPING_LIST_PRODUCT_URL : ALL_PRODUCTS_URL;
}

// TODO write a profiler
var profiler = (function() {
	var startTime;
	var endTime;
	
	return {
		start: function() { 
			startTime = new Date();
			log.info("Start updating price: ", startTime);
		},
		end: function() {
			endTime = new Date();
			var timeElapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
			log.info("End updating price: %s. Took %d seconds", endTime, timeElapsed);
		}
	};
})();


var smartRequest = require('./smart-request')(parallelConnections, null, null, profiler.end);

profiler.start();

smartRequest(getProductsUrl(), {raw: true}, function(productsJson) {
	var products = JSON.parse(productsJson);
	
	log.info("Updating price for %d products...", products.length);
	
	products.forEach(function(product) {
		var hasMC = false, hasCW = false, storeCW = null;
		
		product.stores.forEach(function(store) {		
			if (store.storeName === 'CW') {	
				// Chemist warehouse
				hasCW = true;
				storeCW = store;	
				getChemistWarehousePrice(CW_PRICE_URL, store.productId, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'MC') {
				// My chemist
				hasMC = true;
				getChemistWarehousePrice(MC_PRICE_URL, store.productId, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'PO') {
				// Pharmany online
				getPharmacyOnlinePrice(store.detailUrl, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'PL') {
				// Priceline
				getPricelinePrice(store.detailUrl, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'WW') {
				// Woolworths
				getWoolworthsPrice(store.detailUrl, function(price) {
					updatePrice(product, store, price);
				});
			} else if (store.storeName === 'CO') {
				// Coles
				getColesPrice(store.detailUrl, function(price) {
					updatePrice(product, store, price);
				});
			}
		});
		
		if (!hasMC && hasCW) {
			addToMCStore(storeCW, product);
		}
	});
});

function addToMCStore(storeCW, product) {
	var storeMC = {
		id: product._id,
		store: 'MC',
		detailUrl: storeCW.detailUrl.replace('chemistwarehouse.com.au', 'mychemist.com.au'),
		productId: storeCW.productId,
		photos: []
	};
	
	getChemistWarehousePrice(MC_PRICE_URL, storeMC.productId, function(price) {
		log.info("Got price $%d for [%s] in [%s]", price, product.name, 'MC');
		
		storeMC.price = price;
		
		if (dryRun) return;
		
		request.post({
			headers: {'content-type' : 'application/json'},
			url:     UPDATE_PRICE_URL,
			body:    JSON.stringify(storeMC)
		}, function(error, response, body) {
			if (error) {
				log.error('ERROR when add product to [MC] for [%s]', product.name, error);
			} else {
				log.info('Product [%s] added to [MC] with price $%d ', product.name, price);
			}
		});
	});
}

function updatePrice(product, store, newPrice) {
	log.info("Got price $%d (was $%d) for [%s] in [%s]", 
		newPrice, store.price, product.name, store.storeName);
		
	if (dryRun) return;
		
	if (newPrice !== store.price) {
		var alertType = newPrice < store.price ? 'down' : 'up';
		addPriceAlert(product, store, newPrice, alertType);
		
		updateStorePrice(product, store, newPrice);
	}
}

function addPriceAlert(product, store, newPrice, alertType) {
	var alert = {
		productId: product._id,
		store: store.storeName,
		oldPrice: store.price,
		newPrice: newPrice,
		rrp: product.rrp,
		alertType: alertType
	};
	
	request.post({
		headers: {'content-type' : 'application/json'},
		url:     PRICE_ALERT_URL,
		body:    JSON.stringify(alert)
	}, function(error, response, body)  {
		if (error) {
			log.error('ERROR when add price alert for [%s] in [%s]: %s', 
				product.name, store.storeName, newPrice, error);
		} else {
			log.info('Price alert added for [%s] in [%s]', product.name, store.storeName);
		}
	});
}

function updateStorePrice(product, store, newPrice) {
	request.post({
		headers: {'content-type' : 'application/json'},
		url:     UPDATE_PRICE_URL + product._id + '?price=true',
		body:    JSON.stringify({store: store.storeName, price: newPrice})
	}, function(error, response, body){
		if (error) {
			log.error('ERROR when updating price for [%s] in [%s] to $%d : %s', 
				product.name, store.storeName, newPrice, error);
		} else {
			log.info('Price updated for [%s] in [%s] to $%d ', 
				product.name, store.storeName, newPrice);
		}
	});
}

function extractPrice(text) {
    var result = text.match(/\$([0-9.]+)/);
    if (result && result.length > 1) {
    	return Number(result[1]);
    } 
}

function getWoolworthsPrice(detailUrl, callback) {
	smartRequest(detailUrl, null, function($) {
		callback(extractPrice($('.price').text()));
	});
}

function getColesPrice(detailUrl, callback) {
	smartRequest(detailUrl, null, function($) {
		callback(extractPrice($('.price').text()));
	});
}

function getPricelinePrice(detailUrl, callback) {
	smartRequest(detailUrl, null, function($) {
		var price = $('.basket-right-price').text();
		
		if (price.indexOf('NOW') >= 0) {
			price = price.substring(price.indexOf("NOW"));
		}
		callback(extractPrice(price));
		
		//callback(parseFloat(price.substring(1)));
	});
}

function getPharmacyOnlinePrice(detailUrl, callback) {
	smartRequest(detailUrl, null, function($) {
		var price = $('.price').text();
		callback(parseFloat(price.substring(1)));
	});
}

function getChemistWarehousePrice(priceUrlPrefix, id, callback) {
	smartRequest(priceUrlPrefix + id, {raw: true}, function(priceCallback) {
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

