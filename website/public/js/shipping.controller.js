renebuyApp.controller('ShippingCtrl', function($scope, orderService, deliveryService, $modal) { 
	var orderItemMap = {};
	var boxSeq = 1;
	$scope.boxes = [];
	
	orderService.getShippingOrders().then(function(orders) {
		//console.log(orders);
		orders.forEach(function(order) {
			order.items.forEach(function(item) {
				item.boxes = [];
				orderItemMap[item._id] = item;
			});
		});
		//console.log(orderItemMap);
		$scope.orders = orders;
	}).then(function() {
		deliveryService.getActiveBoxes().then(function(boxes) {
			//console.log(boxes);
			
			boxes.forEach(function(box) {
				var enhancedBox = {
					_id: box._id,
					name: box.name,
					status: box.status,
					trackingNumber: box.trackingNumber,
					recipient: box.recipient,
					shippedDate: box.shippedDate,
					deliveryUpdated : box.deliveryUpdated,
					deliveryInfo: box.deliveryInfo,
					open: box.status === 'new',
					items: [],
					itemCount: {}
				};
				
				box.items.forEach(function(item) {
					var orderItem = orderItemMap[item.orderItemId]
					enhancedBox.items.push(orderItem);
					enhancedBox.itemCount[item.orderItemId] = item.quantity;
					orderItem.boxes.push(enhancedBox);
				});
				
				$scope.boxes.push(enhancedBox);
				
				boxSeq = Math.max(parseInt(box.name.substring(4)), boxSeq);
			});
		});
	});
	
	$scope.addNewBox = function() {
		$scope.boxes.push({
			name: 'Box ' + (boxSeq++),
			status: 'new',
			open: true,
			items: [],
			itemCount: {}
		});
	};
	
	$scope.boxClass = function(item) {
		var finalClass = '';
		if ($scope.selectedItem && $scope.selectedItem._id === item._id) finalClass += ' selected';
		if ($scope.remainder(item) === 0) finalClass += ' unselectable'
		return finalClass;
	};
	
	var panelClasses = {
		'new': 'panel-active',
		'shipped': 'panel-warning',
		'received': 'panel-danger'
	};
	
	$scope.boxHeadingClass = function(box) {
		var selected = false;
		box.items.forEach(function(item) {
			if ($scope.selectedItem && $scope.selectedItem._id === item._id) {
				selected = true;
			}
		});
		return selected ? 'selected' : panelClasses[box.status];
	};
	
	$scope.selectItem = function(item) {
		$scope.selectedItem = item;
	};
	
	$scope.remainder = function(item) {
		var inBox = 0;
		item.boxes.forEach(function(box) {
			inBox += box.itemCount[item._id];
		});
		return item.number - inBox;
	};
	
	$scope.canFulfill = function(order) {
		for (var i = 0; i < order.items.length; i++) {
			var item = order.items[i];
			var inBox = 0, received = 0;
			for (var j = 0; j < item.boxes.length; j++) {
				var box = item.boxes[j];
				if (box.changed) return false;
				inBox += box.itemCount[item._id];
				if (box.status === 'received') received += box.itemCount[item._id];
			}
			
			if (inBox > 0 && received < item.number) {
				return false;
			}
		}
		return true;
	};
	
	$scope.fulfill = function(order, $event) {
		$event.stopPropagation();
		$modal.open({
			templateUrl: 'confirmationModal.html',
			controller: 'ConfirmationModalCtrl',
			resolve: {
				title: function() {
					return 'Fulfill Order';
				},
				text: function() {
					return 'Are you sure you want to fulfill order: "' + order.name + '"?';
				},
				confirm: function() {
					return function() {
						orderService.fulfillOrder(order).then(function() {
							$scope.showAlert('success', 'The order has been fulfilled.');
							order.status = 'fulfilled';
						});
					}
				}
			}
		});
	}
	
	$scope.drop = function(event, ui, box) {
		var addedItem = box.items[box.items.length - 1];
		
		if (box.itemCount[addedItem._id] && box.itemCount[addedItem._id] > 0) {
			box.itemCount[addedItem._id] += 1;
			box.items.splice(-1, 1);
		} else {
			box.itemCount[addedItem._id] = 1;
			addedItem.boxes.push(box);
		}
		
		box.changed = true;
	};
	
	$scope.addToBox = function(box, index, $event) {
		var item = box.items[index];
		box.itemCount[item._id] += 1;
		box.changed = true;
		$event.stopPropagation();
	};
	
	$scope.removeFromBox = function(box, index, $event) {
		var item = box.items[index];
		box.itemCount[item._id] -= 1;
		if (box.itemCount[item._id] === 0) {
			item.boxes.splice(item.boxes.indexOf(box), 1);
			box.items.splice(index, 1);
		}	
		box.changed = true;
		$event.stopPropagation();
	};
	
	$scope.saveBox = function(box, $event) {
		$event.stopPropagation();
		var trimmedBox = {
			_id: box._id,
			name: box.name,
			trackingNumber: box.trackingNumber,
			recipient: box.recipient,
			items: box.items.map(function(item) {
				return {
					orderItemId: item._id,
					quantity: box.itemCount[item._id]
				};
			})
		};
		deliveryService.saveBox(trimmedBox).then(function(savedBox) {
			if (!box._id) box._id = savedBox._id;
			box.changed = false;
			$scope.showAlert('success', 'Information about this box has been saved.');
		});	
	};
	
	$scope.trackDelivery = function(box, $event) {
		$event.stopPropagation();
		$modal.open({
			templateUrl: 'trackBoxModal.html',
			controller: 'TrackBoxModalCtrl',
			resolve: {
				box: function() {
					return box;
				}
			}
		});	
	}
	
	$scope.confirmShip = function(box, $event) {
		$modal.open({
			templateUrl: 'shipBoxModal.html',
			controller: 'ShipBoxModalCtrl',
			resolve: {
				box: function() {
					return box;
				},
				showAlert: function() {
					return $scope.showAlert;
				}
			}
		});
		$event.stopPropagation();
	};
})
.controller('ShipBoxModalCtrl', function($scope, $modalInstance, deliveryService, showAlert, box) {
	$scope.box = box;  
	
	$scope.shipBox = function () {
		console.log($scope.box);
		deliveryService.shipBox($scope.box).then(function() {
			$scope.box.status = 'shipped';
			showAlert('success', 'This box is moved shipped: ' + $scope.box.trackingNumber);
			$modalInstance.close();
		});  
	};

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
})
.controller('TrackBoxModalCtrl', function($scope, $modalInstance, deliveryService, box) {
	$scope.box = box; 

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
})
.controller('ConfirmationModalCtrl', function($scope, $modalInstance, title, text, confirm) {
	$scope.title = title;
	$scope.text = text;
	$scope.confirm = function () {
		confirm();
		$modalInstance.close();
	}; 

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
});