renebuyApp.controller('ShoppingListCtrl', function($scope, orderService) {
	orderService.getShoppingList().then(function(shoppingList) {
		$scope.shoppingList = shoppingList;
		
		angular.forEach($scope.shoppingList, function(product) {
			var total = 0, bought = 0;
			angular.forEach(product.orderItems, function(item) {
				total += item.number;
				item.bought = item.bought || 0;
				bought += item.bought
			});
			product.total = total;
			product.bought = bought;
		});
	});
	
	$scope.buyProduct = function(product) {
		product.bought++;
		
		for(var i = 0; i < product.orderItems.length; i++) {
			var item = product.orderItems[i];
			if (item.bought < item.number) {
				item.bought++;
				break;
			}
		}
		
		// TODO deal with buying more that we need; rene storage order
	};
	
	$scope.returnProduct = function(product) {
		if (product.bought === 0) return;
		product.bought--;
		
		for(var i = product.orderItems.length - 1; i >= 0; i--) {
			var item = product.orderItems[i];
			if (item.bought > 0) {
				item.bought--;
				break;
			}
		}
	};
	
	$scope.storeMap = {
		'CW': {logo: 'CW.png', fullName: 'Chemist warehouse'},
		'CO': {logo: 'CO.png', fullName: 'Coles'},
		'PL': {logo: 'PL.jpg', fullName: 'Priceline'},
		'PO': {logo: 'PO.jpg', fullName: 'Pharmacy online'},
		'WW': {logo: 'WW.jpg', fullName: 'Woolworths'},
		'MC': {logo: 'MC.jpg', fullName: 'My chemist'} 
	};
	
	$scope.storeLogo = function(store) {
		return '/images/store-logo/' + storeLogos[store];
	}
}); 