renebuyApp
.factory('orderService', function($resource) {
	var Orders = $resource('/api/order');
	var Order = $resource('/api/order/:orderId', {orderId: '@orderId'});
	var OrderItem = $resource('/api/order/:orderId/:itemId', {orderId: '@orderId', itemId: '@itemId'});
	
	return {
		addOrderItem: function(item) {
			return Orders.save(item).$promise;
		},
		getActiveOrderNames: function() {
			return Orders.query({activeName: true}).$promise;
		},
		getActiveOrders: function() {
			return Orders.query({active: true}).$promise;
		},
		getShoppingList: function() {
			return Orders.query({shoppingList: true}).$promise;
		},
		updateOrder: function(orderId, deleted, updated) {
			return Order.save({orderId: orderId}, {deleted: deleted, updated: updated}).$promise;
		},
		updateItem: function(orderId, item) {
			return OrderItem.save({orderId: orderId, itemId: item._id}, {
				price: item.price,
				number: item.number,
				description: item.description
			}).$promise;
		},
		deleteItem: function(orderId, itemId) {
			return OrderItem.remove({orderId: orderId, itemId: itemId}).$promise;
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