var app = angular.module('main', ['ngResource']).
controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}}
	});
	
	$scope.search = function() {
		Product.query({q: $scope.searchText}, function(products) {
			products.forEach(function(product) {estimatePrices(product); });
			$scope.products = products;
		});
	};
	
	$scope.search();
	
	function estimatePrices(product) {
		product.unitPostage = product.isHighTax ? 12 : 10;
		
		product.buyPrice = product.stores[0].price;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
				break;
			}
		}
	}
	
	$scope.postage = function(product) {
		return product.unitPostage / 1000 * (product.weight || 0);
	}
	
	$scope.reneBuyPriceInRmb = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	}
	
	$scope.updateWeight = function(product) {
		console.log('tttt',product._id, product.weight);
		Product.updateWeight({id: product._id}, JSON.stringify({newWeight: product.weight}), function(result) {
			console.log('rrr', result);
		})
		
	}
	
	
}).filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
	    return $filter('number')(input * 100, decimals) + '%';
	};
}]);;