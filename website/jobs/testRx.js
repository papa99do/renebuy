var Rx = require('rx');

Rx.Observable.fromTimedArray = function(array, interval) {
  return Rx.Observable.from(array).zip(Rx.Observable.interval(interval || 2000), function(a, b) { return a; });
}

function randomTime(second) {
  return Math.floor((Math.random() * second * 1000) + 1);
}

function log(message) {
  console.log('[%s] %s', new Date(), message);
}

function logCallback(data) {
  log('onNext with parameter: ' + data);
}

function onComplete() {
  log('onComplete');
}

function getProductsAsync(callback) {
  setTimeout(function() {
    log('Products returned');
    callback([1, 2, 3, 4, 5, 6]);
  }, 1000);
}

function getPriceAsync(product, callback) {
  var randTime = randomTime(1);
  setTimeout(function() {
    log('Price returned for product: ' + product + ' after ' + randTime);
    callback({name: product, newPrice: 5.5});
  }, randTime);
}

function updateProduct(product, callback) {
  var randTime = randomTime(1);
  setTimeout(function() {
    log('Price updated for product: ' + product.name + ' after ' + randTime);
    callback(product.name);
  }, randTime);
}



log('Start');
Rx.Observable.fromCallback(getProductsAsync)()
  .flatMap(Rx.Observable.fromTimedArray)
  .flatMap(function (p) {
    return Rx.Observable.fromCallback(getPriceAsync)(p);
  })
  .flatMap(function (newP) {
    return Rx.Observable.fromCallback(updateProduct)(newP);
  })
  .subscribe(logCallback, null, onComplete);
