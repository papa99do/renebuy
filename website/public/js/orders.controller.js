renebuyApp.controller('OrderCtrl', function($scope, orderService, ngTableParams) {
	
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
	}

});