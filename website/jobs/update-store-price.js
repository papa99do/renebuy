var _ = require('lodash');
var Rx = require('rx');
var Promise = require('promise');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var Product  = require('../app/models/product');
var PriceAlert = require('../app/models/price-alert');

var GET_PRICE_INTERVAL = 2000; //ms
var MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';

Rx.Observable.fromTimedArray = function(array, interval) {
  return Rx.Observable.from(array).zip(Rx.Observable.interval(interval || 1000), function(a, b) { return a; });
}

onStart();
findWatchedProducts()
  .then(function (products) {
    return _.flatMap(products, toStoreInfo);
  })
  .then(emitOverTime)
  .then(function(storeStream) {
    storeStream.subscribe(updateStorePrice, null, onComplete);
  });

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

function toStoreInfo(product) {
  return _.map(product.stores, function(store) {
    return {
      id: product.id,
      name: product.name,
      rrp: product.rrp,
      price: store.price,
      lowestPrice: store.lowestPrice,
      productId: store.productId,
      detailUrl: store.detailUrl,
      storeName: store.storeName,
    };
  });
}

function updateStorePrice(storeInfo) {
  Promise.resolve(storeInfo)
    .then(getNewPrice)
    .then(updateProduct)
    .then(createPriceAlert)
    .catch(console.error);
}

function info(product) {
  var storeName = stores[product.storeName] && stores[product.storeName].name || product.storeName;
  return product.name + ' at ' + storeName;
}

function getNewPrice(product) {
  return new Promise(function(resolve, reject) {
    console.log("Get price for product '%s'", info(product));
    var store = stores[product.storeName];
    if (!store || !store.priceExtractor) {
      return reject('No update price function for product: ' + info(product));
    }
    var priceUrl = store.priceUrlGenerator ? store.priceUrlGenerator(product) : product.detailUrl;
    request(priceUrl, function(err, response, html) {
      if (err) return reject(err);
      var price = store.priceExtractor(html);
      if (!price) return reject('New price not found for product: ' + info(product));
      if (price === product.price) return reject('Price ' + price + ' does not change for product: ' + info(product));

      product.newPrice = price;
      resolve(product);
    })
  });
}

function extractPrice(text, pattern) {
	var pattern = pattern || /\$([0-9.]+)/;
    var result = text.match(pattern);
    if (result && result.length > 1) {
    	return Number(result[1]);
    }
	return null;
}

function priceFrom(selector) {
  return function(html) {
    return extractPrice(cheerio.load(html)(selector).text().trim());
  };
}

function detailUrl(product) {
  return product.detailUrl;
}

function woolworthsPriceUrl(product) {
  return 'https://www.woolworths.com.au/apis/ui/product/detail/' + product.productId;
}

function woolworthsPriceExtractor(json) {
  return JSON.parse(json).Product.Price;
}

var stores = {
  'CW': {name:'Chemist Warehouse', priceExtractor: priceFrom('[itemprop=price]') },
  'MC': {name:'My Chemist', priceExtractor: priceFrom('[itemprop=price]') },
  'PL': {name:'Priceline', priceExtractor: priceFrom('[itemprop=price]') },
  'CO': {name:'Coles', priceExtractor: priceFrom('.price') },
  'WW': {name:'Woolworths', priceUrlGenerator: woolworthsPriceUrl, priceExtractor: woolworthsPriceExtractor },
  'PO': {name:'Pharmacy online'},
  'JJ': {name:'Jack and Jill'},
  'SK': {name:'Sukin'},
  'TR': {name:'ToysRus'},
  'BB': {name:'Baby Bunting'},
};

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
        console.log("Price of '%s' changed from %d to %d", info(product), product.price, product.newPrice);
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
  		rrp: product.rrp,
      alertType: product.price < product.newPrice ? 'up' : 'down'
  	}, function(err) {
  		if(err) return reject(err);
      console.log("Price alert created for product '%s'", product.name);
  		resolve(product);
  	});
  });
}

function onStart() {
  mongoose.connect(MONGO_URL);
  mongoose.set('debug', true);
  console.log("====JOB(dwPriceUpdater)==== Start updating prices");
}

function onComplete() {
  console.log("====JOB(dwPriceUpdater)==== Done: All prices updated");
  mongoose.connection.close();
}
