renebuyApp.controller('OrderCtrl', function($scope, orderService, ngTableParams) {
	
	orderService.getActiveOrders().then(function(result) {
		$scope.orders = result;
		$scope.orders.forEach(function(order) {
			order.totalPrice = 0;
			order.totalQuantity = 0;
			
			order.items.forEach(function(item) {
				order.totalQuantity += item.number;
				order.totalPrice += item.price * item.number;
			});
		});
	});

});