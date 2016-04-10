var Promise = require('promise');
var _ = require('lodash');
var Product  = require('../models/product');
var PriceCollector = require('./price-collector');


function updatePrices() {
  findWatchedProducts().then(getCWStoreInfo).then(printOut);
}

function findWatchedProducts() {
  return new Promise(function(resolve, reject) {
    Product.find({watchPrice: true}).select('name stores rrp').exec(function(err, products) {
      if (err) return reject(err);
      resolve(products);
    });
  });
}

function getCWStoreInfo(products) {
  return products.map(function(p) {
    var cwStore = _.find(p.stores, {storeName: 'CW'});
    return {
      name: p.name,
      rrp: p.rrp,
      price: cwStore.price,
      lowestPrice: cwStore.lowestPrice,
      productId: cwStore.productId
    };
  });
}

function printOut(watchedProducts) {
  console.log(watchedProducts);
}

module.exports = {
  updatePrices: updatePrices
};
