renebuyApp
.factory('orderService', function($resource) {
	var Order = $resource('/api/order');
	
	return {
		addOrderItem: function(item) {
			return Order.save(item).$promise;
		},
		getActiveOrderNames: function() {
			return Order.query({activeName: true}).$promise;
		},
		getActiveOrders: function() {
			return Order.query({active: true}).$promise;
		},
		getShoppingList: function() {
			return Order.query({shoppingList: true}).$promise;
		}
	}
})
.controller('MainCtrl', function($scope, $translate, $timeout) {
	$scope.editMode = false;
	$('.navbar-collapse a').click(function(){
	    $(".navbar-collapse").collapse('hide');
	});
	
	$scope.lang = 'en';
	$scope.changeLang = function() {
		$scope.lang = ($scope.lang === 'en' ? 'ch' : 'en');
		$translate.use($scope.lang);
	}
	
	$scope.alert = null;
	$scope.showAlert = function(type, msg) {
		$scope.alert = {type: type, msg: msg};
		$timeout(function() {
			$scope.alert = null;
		}, 2000);
	}
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
});