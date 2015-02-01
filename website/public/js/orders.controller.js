renebuyApp.controller('OrderCtrl', function($scope, orderService, ngTableParams) {
	
	orderService.getActiveOrders().then(function(result) {
		$scope.orders = result;
		$scope.orders.forEach(function(order) {
			order.tableParams = new ngTableParams({
			    count: order.items.length // hides pager
			},{
			    counts: [] // hides page sizes
			});
		});
	});
});