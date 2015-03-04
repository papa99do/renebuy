renebuyApp.controller('OrderCtrl', function($scope, orderService, $modal) {
	
	function calcTotal(order) {
		order.totalQuantity = 0;
		order.totalAmount = 0;
		order.items.forEach(function(item) {
			order.totalQuantity += item.number;
			order.totalAmount += item.number * item.price;
		});
	}
	
	orderService.getActiveOrders().then(function(result) {
		$scope.orders = result;
		$scope.orders.forEach(function(order) {
			calcTotal(order);
		});
	});
	
	$scope.edit = function(order, $event) {
		order.editable = true;
		$event.stopPropagation();
	};
	
	$scope.save = function(order, $event) {
		var deleted = [], updated = {};
		order.items.forEach(function(item) {
			if (item.deleted) {
				deleted.push(item._id);
			} else if (item.updated) {
				updated[item._id] = {
					number: item.number,
					price: item.price,
					description: item.description
				};
			}
		});
		
		console.log('Updating order', order._id, deleted, updated);
		
		$event.stopPropagation();
		orderService.updateOrder(order._id, deleted, updated).then(function(result) {
			order.items.forEach(function(item) {
				if (item.deleted) {
					order.items.splice(order.items.indexOf(item), 1);
				} else if (item.updated) {
					item.updated = false;
				}
			});
			
			calcTotal(order);
			order.editable = false;
			
			$scope.showAlert('success', 'Order updated successfully!');
		});
	};
	
	$scope.orderItemClass = function(item) {
		return item.deleted ? 'danger' : (item.updated ? 'info' : '');
	};
	
	$scope.confirmShip = function(order, $event) {
		$modal.open({
			templateUrl: 'shipOrderModal.html',
			controller: 'ShipOrderModalCtrl',
			resolve: {
				order: function() {
					return order;
				},
				showAlert: function() {
					return $scope.showAlert;
				}
			}
		});
		$event.stopPropagation();
	};

})
.controller('ShipOrderModalCtrl', function($scope, $modalInstance, orderService, showAlert, order) {
	$scope.order = order;  
	
	$scope.shipOrder = function () {
		console.log($scope.order);
		orderService.shipOrder($scope.order).then(function() {
			$scope.order.status = 'shipping';
			$scope.order.editable = false;
			showAlert('success', 'This order is moved to shipping');
			$modalInstance.close();
		});  
	};

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
});