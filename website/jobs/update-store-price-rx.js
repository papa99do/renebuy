var Rx = require('rx');
var _ = require('lodash');
var request = require('request');
var mongoose = require('mongoose');

var stores = require('../common/store-price-helper').stores;
var Product = require('../app/models/product');
var PriceAlert = require('../app/models/price-alert');

var MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/renebuy';
var watchedProductsQuery = Product.find({watchPrice: true}).select('name stores rrp');

function log(message, p) {
  console.log("[%s|%s: %s at %s]: %s", p.id, p.productId, p.name, p.fullStoreName, message);
}

function toStoreInfo(product) {
  return product.stores.map(function(store) {
    var extraInfo = stores[store.storeName] || {};
    var priceUrl = extraInfo.priceUrlGenerator && extraInfo.priceUrlGenerator(store) || store.detailUrl;

    return {
      id: product.id,
      name: product.name,
      rrp: product.rrp,
      price: store.price,
      lowestPrice: store.lowestPrice,
      productId: store.productId,
      priceUrl: priceUrl,
      storeName: store.storeName,
      fullStoreName: extraInfo.name || store.storeName,
      priceExtractor: extraInfo.priceExtractor,
    };
  });
}

function getNewPrice(productInStore) {
  return Rx.Observable.create(function (observer) {
    if (!productInStore.priceExtractor) {
      log('ERROR: No priceExtractor found!', productInStore);
      observer.onCompleted();
      return;
    }

    request(productInStore.priceUrl, function (error, response, body) {
      if (error) {
        log('ERROR: Cannot fetch price from url: ' + productInStore.priceUrl, productInStore);
        observer.onCompleted();
        return;
      }

      var newPrice = productInStore.priceExtractor(body);
      if (!newPrice) {
        log('ERROR: Cannot extract price from url: ' + productInStore.priceUrl, productInStore);
      } else if (newPrice === productInStore.price) {
        log('INFO: Price ' + newPrice + ' does not change.', productInStore);
      } else {
        log('INFO: New price ' + newPrice + ' found!', productInStore);
        productInStore.newPrice = newPrice;
        observer.onNext(productInStore);
      }

      observer.onCompleted();
    });

  });
}

function updateProduct(productInStore) {
  return Rx.Observable.create(function (observer) {
    Product.findById(productInStore.id, function(err, oldProduct) {
      if (err || !oldProduct) {
        log('ERROR: Cannot find product! ' + err, productInStore);
        observer.onCompleted();
        return;
      }

      var store = _.find(oldProduct.stores, {storeName: productInStore.storeName});
      store.price = productInStore.newPrice;
      if (productInStore.newPrice < productInStore.lowestPrice) {
        store.lowestPrice = productInStore.newPrice;
      }

      oldProduct.save(function(err) {
        if (err) {
          log('ERROR: Cannot save product! ' + err, productInStore);
          observer.onCompleted();
          return;
        }
        log('INFO: Price changed from ' + productInStore.price + ' to ' + productInStore.newPrice, productInStore);
        observer.onNext(productInStore);
        observer.onCompleted();
      });
    });
  });
}

function createPriceAlert(productInStore) {
  return Rx.Observable.create(function (observer) {
    PriceAlert.create({
  		product: mongoose.Types.ObjectId(productInStore.id),
  		store: productInStore.storeName,
  		oldPrice: productInStore.price,
  		newPrice: productInStore.newPrice,
  		rrp: productInStore.rrp,
      alertType: productInStore.price < productInStore.newPrice ? 'up' : 'down'
  	}, function(err) {
      if (err) {
        log('ERROR: Cannot create price alert! ' + err, productInStore);
      } else {
        log('INFO: Price alert created.', productInStore);
      }
      observer.onNext(productInStore);
  		observer.onCompleted();
  	});
  });
}

Rx.Observable.fromMongoQuery = function(query) {
  return Rx.Observable.create(function (observer) {
    query.stream()
      .on('data', function(data){
        observer.onNext(data);
      })
      .on('error', function(error) {
        observer.onError(error);
      })
      .on('close', function() {
        observer.onCompleted();
      });
  });
}

function commence() {
  console.log("====== UPDATE PRICE TASK ====== STARTED");
  mongoose.connect(MONGO_URL);
}

function complete() {
  mongoose.connection.close();
  console.log("====== UPDATE PRICE TASK ====== FINISHED");
}


function first(a, b) { return a; }
function sink() {}

commence();
Rx.Observable.fromMongoQuery(watchedProductsQuery)
  .flatMap(toStoreInfo)
  .zip(Rx.Observable.interval(2000), first)
  .flatMap(getNewPrice)
  .flatMap(updateProduct)
  .flatMap(createPriceAlert)
  .subscribe(sink, null, complete);
