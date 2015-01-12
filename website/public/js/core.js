var app = angular.module('main', ['ngResource', 'xeditable']).
controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}},
		updateCategory: {method: 'POST', params:{category: true}}
	});
	
	$scope.search = function() {
		Product.query({q: $scope.searchText}, function(products) {
			products.forEach(function(product) {enhance(product); });
			$scope.products = products;
		});
	};
	
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
		
		product.categoryStr = product.category.join(" > ");
	}
	
	$scope.postage = function(product) {
		return product.unitPostage / 1000 * (product.weight || 0);
	};
	
	$scope.reneBuyPriceInRmb = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	};
	
	$scope.updateWeight = function(product) {
		console.log('www',product._id, product.weight);
		Product.updateWeight({id: product._id}, JSON.stringify({newWeight: product.weight}), function(result) {
			console.log('wwwrrr', result);
		});	
	};
	
	$scope.updateCategory = function(product) {
		console.log('ccc',product._id, product.categoryStr);
		Product.updateCategory({id: product._id}, JSON.stringify({newCategory: product.categoryStr}), function(result) {
			console.log('cccrrr', result);
		});
	};
	
	
})
.filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
	    return $filter('number')(input * 100, decimals) + '%';
	};
}])
.run(function(editableOptions, editableThemes) {
  	editableThemes.bs3.inputClass = 'input-sm';
  	editableThemes.bs3.buttonsClass = 'btn-sm';
  	editableOptions.theme = 'bs3';
});;