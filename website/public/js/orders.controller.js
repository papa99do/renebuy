renebuyApp.controller('OrderCtrl', function($scope, orderService, $modal, excelService, $templateCache, $compile, $timeout) {
	$scope.productStock = {};
	
	function enhance(order) {
		order.totalQuantity = 0;
		order.totalAmount = 0;
		order.productQuantities = {};
		order.items.forEach(function(item) {
			order.totalQuantity += item.number;
			order.totalAmount += item.number * item.price;
			order.productQuantities[item.product._id] = order.productQuantities[item.product._id] || 0;
			order.productQuantities[item.product._id] += item.number;
			//console.log(item.product.salesInfo);
			$scope.productStock[item.product._id] = item.product.salesInfo.bought - item.product.salesInfo.sold;
		});
	}
	
	orderService.getActiveOrders().then(function(result) {
		$scope.orders = result;
		$scope.orders.forEach(function(order) {
			enhance(order);
		});
	});
	
	$scope.edit = function(order, $event) {
		order.editable = true;
		$event.stopPropagation();
	};
	
	$scope.sufficient = function(item, order) {
		// console.log('Stock: %d, Qty: %d for product: %s', $scope.productStock[item.product._id], order.productQuantities[item.product._id], item.product.name);
		return $scope.productStock[item.product._id] >= order.productQuantities[item.product._id];
	};
	
	$scope.canShip = function(order) {
		for (var i = 0; i < order.items.length; i++) {
			if (!$scope.sufficient(order.items[i], order)) {
				return false;
			}
		}
		return true;
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
		orderService.updateOrder(order._id, deleted, updated, order.name).then(function(result) {
			
			for (var i = order.items.length - 1; i >= 0; i--) {
				if (order.items[i].deleted) {
					console.log('delete item: %s, form index %d', order.items[i]._id, i);
					order.items.splice(i, 1);
				} else if (order.items[i].updated) {
					order.items[i].updated = false;
				}
			}
			
			enhance(order);
			order.editable = false;
			
			$scope.showAlert('success', 'Order updated successfully!');
		});
	};
	
	$scope.exportOrder = function(order, $event) {
		$event.stopPropagation();
		$scope.order = order;
		var tableHtml = $compile($templateCache.get('orderExcel.html'))($scope);
		$timeout(function() {
			excelService.exportExcel('Order-' + order.name + '.xls', order.name, tableHtml.html());
		    //console.log(tableHtml.html());
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
				},
				shipOrder: function() {
					return function(order) {
						angular.forEach(order.productQuantities, function(value, key) {
							console.log('deduct product stock: ', value, key);
							$scope.productStock[key] -= value;
						});
					}
				}
			}
		});
		$event.stopPropagation();
	};

})
.controller('ShipOrderModalCtrl', function($scope, $modalInstance, orderService, showAlert, order, shipOrder) {
	$scope.order = order;  
	
	$scope.shipOrder = function () {
		console.log($scope.order);
		orderService.shipOrder($scope.order).then(function() {
			$scope.order.status = 'shipping';
			$scope.order.editable = false;
			shipOrder($scope.order);
			showAlert('success', 'This order is moved to shipping: ' + $scope.order.name);
			$modalInstance.close();
		});  
	};

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
});