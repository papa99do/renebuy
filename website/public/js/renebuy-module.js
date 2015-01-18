var renebuyApp = angular.module('renebuy', ['ui.router', 'ngResource', 'xeditable', 'treeControl']);

renebuyApp.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/products");
  //
  // Now set up the states
  $stateProvider
    .state('products', {
      url: "/products",
      templateUrl: "partials/products.html",
	  controller: "ProductCtrl"
    })
    .state('priceList', {
      url: "/price-list",
      templateUrl: "partials/price-list.html",
      controller: "PriceListCtrl"
    });
});