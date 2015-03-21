renebuyApp.controller('ShippingCtrl', function($scope, orderService, deliveryService) { 
	var orderItemMap = {};
	var boxSeq = 1;
	$scope.boxes = [];
	
	orderService.getShippingOrders().then(function(orders) {
		orders.forEach(function(order) {
			order.items.forEach(function(item) {
				item.inBox = 0;
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
					trackingNumber: box.trackingNumber,
					recipient: box.recipient,
					items: [],
					itemCount: {}
				};
				
				box.items.forEach(function(item) {
					var orderItem = orderItemMap[item.orderItemId]
					enhancedBox.items.push(orderItem);
					enhancedBox.itemCount[item.orderItemId] = item.quantity;
					orderItem.inBox += item.quantity;
				});
				
				$scope.boxes.push(enhancedBox);
			});
		});
	});
	
	$scope.addNewBox = function() {
		$scope.boxes.push({
			name: 'Box ' + (boxSeq++),
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
	
	$scope.selectItem = function(item) {
		$scope.selectedItem = item;
	};
	
	$scope.remainder = function(item) {
		return item.number - item.inBox;
	};
	
	$scope.drop = function(event, ui, box) {
		var addedItem = box.items[box.items.length - 1];
		addedItem.inBox = addedItem.inBox + 1;
		
		if (box.itemCount[addedItem._id] && box.itemCount[addedItem._id] > 0) {
			box.itemCount[addedItem._id] += 1;
			box.items.splice(-1, 1);
		} else {
			box.itemCount[addedItem._id] = 1;
		}
		
		box.changed = true;
	};
	
	$scope.addToBox = function(box, index, $event) {
		var item = box.items[index];
		item.inBox += 1;
		box.itemCount[item._id] += 1;
		box.changed = true;
		$event.stopPropagation();
	};
	
	$scope.removeFromBox = function(box, index, $event) {
		var item = box.items[index];
		item.inBox -= 1;
		box.itemCount[item._id] -= 1;
		if (box.itemCount[item._id] === 0) {
			box.items.splice(index, 1);
		}	
		box.changed = true;
		$event.stopPropagation();
	};
	
	$scope.removeBox = function(index) {
		var box = $scope.boxes[index];
		box.items.forEach(function(item) {
			item.inBox -= box.itemCount[item._id];
		});
		$scope.boxes.splice(index, 1);
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
	}
});