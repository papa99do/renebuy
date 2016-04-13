var _ = require('lodash');
var Rx = require('rx');
var Promise = require('promise');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var Product  = require('./app/models/product');
var PriceAlert = require('./app/models/price-alert');

var GET_PRICE_INTERVAL = 2000; //ms

var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';

mongoose.connect(mongoUrl);
mongoose.set('debug', true);

Rx.Observable.fromTimedArray = function(array, interval) {
  return Rx.Observable.from(array).zip(Rx.Observable.interval(interval || 1000), function(a, b) { return a; });
}

function findWatchedProducts() {
  return new Promise(function(resolve, reject) {
    Product.find({watchPrice: true}).select('name stores rrp').exec(function(err, products) {
      if (err) return reject(err);
      resolve(products);
    });
  });
}

function emitOverTime(products) {
  return Rx.Observable.fromTimedArray(products, GET_PRICE_INTERVAL);
}

findWatchedProducts()
  .then(emitOverTime)
  .then(function(productStream) {
    productStream.subscribe(updatePrice, null, logComplete);
  });

function updatePrice(product) {
  Promise.resolve(product)
    .then(getCWInfo)
    .then(getNewPrice)
    .then(updateProduct)
    .then(createPriceAlert)
    .catch(console.error);
}

function getCWInfo(product) {
  var cwStore = _.find(product.stores, {storeName: 'CW'});
  return {
    id: product.id,
    name: product.name,
    rrp: product.rrp,
    price: cwStore.price,
    lowestPrice: cwStore.lowestPrice,
    productId: cwStore.productId,
    detailUrl: cwStore.detailUrl
  };
}

function extractPrice(text, pattern) {
	var pattern = pattern || /\$([0-9.]+)/;
    var result = text.match(pattern);
    if (result && result.length > 1) {
    	return Number(result[1]);
    }
	return null;
}

function getNewPrice(product) {
  return new Promise(function(resolve, reject) {
    console.log("Get price for product '%s'", product.name);
    request(product.detailUrl, function(err, response, html) {
      if (err) return reject(err);
      var price = extractPrice(cheerio.load(html)('[itemprop=price]').text());
      if (!price) return reject('New price not found for product: ' + product.name);
      if (price === product.price) return reject('Price does not change for product: ' + product.name);

      product.newPrice = price;
      resolve(product);
    })
  });
}

function updateProduct(product) {
  return new Promise(function(resolve, reject) {
    Product.findById(product.id, function(err, oldProduct) {
      if (err) return reject(err);
      if (!oldProduct) return reject('Product not found: ' + product.name);

      var cwStore = _.find(oldProduct.stores, {storeName: 'CW'});
      cwStore.price = product.newPrice;
      if (product.newPrice < product.lowestPrice) {
        cwStore.lowestPrice = product.newPrice;
      }

      oldProduct.save(function(err) {
        if (err) return reject(err);
        console.log("Price of '%s' changed from %d to %d", product.name, product.price, product.newPrice);
        resolve(product);
      });
    });
  });
}

function createPriceAlert(product) {
  return new Promise(function(resolve, reject) {
    PriceAlert.create({
  		product: mongoose.Types.ObjectId(product.id),
  		store: 'CW',
  		oldPrice: product.price,
  		newPrice: product.newPrice,
  		rrp: product.rrp
  	}, function(err) {
  		if(err) return reject(err);
      console.log("Price alert created for product '%s'", product.name);
  		resolve(product);
  	});
  });
}

function logComplete() {
  console.log('Price update complete!');
}
