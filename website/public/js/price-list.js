var app = angular.module('pricelist', ['ngResource'], function($locationProvider) {
    $locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	});
}).
controller('PriceListCtrl', function($scope, $resource, $location) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product');
	
	$scope.search = function() {
		Product.query({category : $scope.category}, function(products) {
			products.forEach(function(product) {enhance(product);});
		});
	};
	
	$scope.category = $location.search().category;
	$scope.categoryMap = {};
	$scope.search();
	
	function enhance(product) {
		product.unitPostage = product.isHighTax ? 12 : 10;
		
		product.buyPrice = product.stores[0].price;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
				break;
			}
		}
		
		if ($scope.categoryMap[product.category[2]] === undefined) {
			$scope.categoryMap[product.category[2]] = [];
		}
		
		$scope.categoryMap[product.category[2]].push(product);
		
	}
	
	$scope.postage = function(product) {
		return product.unitPostage / 1000 * (product.weight || 0);
	};
	
	$scope.reneBuyPriceInRmb = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	};
	
	$scope.reneBuyPriceInRmbWithAdjustment = function(product) {
		return $scope.reneBuyPriceInRmb(product) + parseFloat(product.priceAdjustment);
	}
});