renebuyApp.controller('OrderCtrl', function($scope, orderService, ngTableParams) {
	
	orderService.getActiveOrders().then(function(result) {
		$scope.orders = result;
	});
	
	$scope.toggleOrderEditMode = function(order, $event) {
		order.editable = !order.editable;
		$event.stopPropagation();
	};
	
	$scope.updateItem = function(orderId, item) {
		orderService.updateItem(orderId, item).then(function (result) {
			$scope.showAlert('success', 'Order item updated successfully!');
		});
	};
	
	$scope.deleteItem = function(order, item, index) {
		orderService.deleteItem(order._id, item._id).then(function (result) {
			$scope.showAlert('success', 'Order item deleted successfully!');
			order.items.splice(index, 1);
		});
	};
	
	$scope.totalQuantity = function(order) {
		var totalQuantity = 0;
		order.items.forEach(function(item) {
			totalQuantity += item.number;
		});
		return totalQuantity;
	};
	
	$scope.totalAmount = function(order) {
		var totalAmount = 0;
		order.items.forEach(function(item) {
			totalAmount += item.price * item.number;
		});
		return totalAmount;
	};

});