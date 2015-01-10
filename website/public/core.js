var app = angular.module('main', ['ngResource']).
controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	var Products = $resource('/api/product/:id', {id: '@id'});
	
	$scope.search = function() {
		Products.query({q: $scope.searchText}, function(products) {
			$scope.products = products;
		});
	};
	
	$scope.search();
}).filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
	    return $filter('number')(input * 100, decimals) + '%';
	};
}]);;