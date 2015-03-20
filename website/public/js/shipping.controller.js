renebuyApp.controller('ShippingCtrl', function($scope, orderService) { 
	orderService.getShippingOrders().then(function(orders) {
		console.log(orders);
		$scope.orders = orders;
	});
	
	var boxSeq = 1;
	
	$scope.boxes = [];
	$scope.addNewBox = function() {
		$scope.boxes.push({
			name: 'New Box ' + (boxSeq++),
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
		return item.number - (item.inBox || 0);
	};
	
	$scope.drop = function(event, ui, box) {
		var addedItem = box.items[box.items.length - 1];
		addedItem.inBox = (addedItem.inBox || 0) + 1;
		
		if (box.itemCount[addedItem._id] && box.itemCount[addedItem._id] > 0) {
			box.itemCount[addedItem._id] += 1;
			box.items.splice(-1, 1);
		} else {
			box.itemCount[addedItem._id] = 1;
		}
	};
	
	$scope.addToBox = function(box, index, $event) {
		var item = box.items[index];
		item.inBox += 1;
		box.itemCount[item._id] += 1;
		$event.stopPropagation();
	};
	
	$scope.removeFromBox = function(box, index, $event) {
		var item = box.items[index];
		item.inBox -= 1;
		box.itemCount[item._id] -= 1;
		if (box.itemCount[item._id] === 0) {
			box.items.splice(index, 1);
		}	
		$event.stopPropagation();
	};
	
	$scope.removeBox = function(index) {
		var box = $scope.boxes[index];
		box.items.forEach(function(item) {
			item.inBox -= box.itemCount[item._id];
		});
		$scope.boxes.splice(index, 1);
	};
});