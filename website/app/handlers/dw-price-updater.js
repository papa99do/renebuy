var Promise = require('promise');
var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');

var Product  = require('../models/product');


function updatePrices() {
  findWatchedProducts().then(getCWStoreInfo).then(printOut).then(getPrices);
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
      id: p.id,
      name: p.name,
      rrp: p.rrp,
      price: cwStore.price,
      lowestPrice: cwStore.lowestPrice,
      productId: cwStore.productId,
      detailUrl: cwStore.detailUrl
    };
  });
}

function printOut(watchedProducts) {
  console.log(watchedProducts);
  return watchedProducts;
}

function getPrices(products) {
  products.forEach(function(p) {
    getDetailPage(p).then(parsePrice).then(function(newPrice) {printNewPrice(newPrice, p)});
  });
}

function getDetailPage(p) {
  return new Promise(function(resolve, reject) {
    request(p.detailUrl, function(err, response, html) {
      if (err) return reject(err);
      resolve(html);
    })
  });
}

function parsePrice(html) {
  var price = cheerio.load(html)('[itemprop=price]').text();
  return price;
}

function printNewPrice(price, p) {
  console.log("Price for '%s' is %s", p.name, price);
}

module.exports = {
  updatePrices: updatePrices
};
