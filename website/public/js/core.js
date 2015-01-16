var app = angular.module('main', ['ngResource', 'xeditable']).
controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}},
		updateCategory: {method: 'POST', params:{category: true}},
		updatePriceAdjustment: {method: 'POST', params:{priceAdjustment: true}},
		updateNameInChinese: {method: 'POST', params:{nameInChinese: true}}
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
	
	$scope.reneBuyPriceInRmbWithAdjustment = function(product) {
		return $scope.reneBuyPriceInRmb(product) + parseFloat(product.priceAdjustment);
	}
	
	$scope.updateWeight = function(product) {
		Product.updateWeight({id: product._id}, JSON.stringify({weight: product.weight}), function(result) {
			console.log('Weight changed to: %dg for [%s]', parseInt(product.weight), product.name);
		});	
	};
	
	$scope.updateCategory = function(product) {
		Product.updateCategory({id: product._id}, JSON.stringify({category: product.categoryStr}), function(result) {
			console.log('Category changed to: %s for [%s]', product.categoryStr, product.name);
		});
	};
	
	$scope.updatePriceAdjustment = function(product) {
		Product.updatePriceAdjustment({id: product._id}, JSON.stringify({priceAdjustment: product.priceAdjustment}), function(result) {
			console.log('Price adjustment changed to %d for [%s]' , parseFloat(product.priceAdjustment), product.name);
		});
	};
	
	$scope.updateNameInChinese = function(product) {
		Product.updateNameInChinese({id: product._id}, JSON.stringify({nameInChinese: product.nameInChinese}), function(result) {
			console.log('Chinese name changed to %s for [%s]' , product.nameInChinese, product.name);
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