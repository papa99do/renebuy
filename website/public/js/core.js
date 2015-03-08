renebuyApp
.factory('orderService', function($resource, $q) {
	var Orders = $resource('/api/order');
	var Order = $resource('/api/order/:orderId', {orderId: '@orderId'}, {
		ship: {method: 'POST', params:{ship: true}}
	});
	
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
			return Orders.query({shoppingList: true, details: true}).$promise;
		},
		updateOrder: function(orderId, deleted, updated, name) {
			return Order.save({orderId: orderId}, {deleted: deleted, updated: updated, name: name}).$promise;
		},
		shipOrder: function(order) {
			return Order.ship({orderId: order._id}).$promise;
		}
	}
})
.factory('purchaseService', function($resource) {
	var Purchases = $resource('/api/purchase');
	
	return {
		purchase: function(productId, quantity, price) {
			return Purchases.save({productId: productId, price: price, quantity: quantity}).$promise;
		}
	};
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
.directive('safeInput', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            element.bind('click', function (event) {
                event.stopPropagation();
				event.preventDefault();
            });
        }
    };
})
.run(function(editableOptions, editableThemes) {
  	editableThemes.bs3.inputClass = 'input-sm';
  	editableThemes.bs3.buttonsClass = 'btn-sm';
  	editableOptions.theme = 'bs3';
});