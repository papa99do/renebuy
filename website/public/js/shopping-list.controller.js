renebuyApp.controller('ShoppingListCtrl', function($scope, orderService, purchaseService) {
	orderService.getShoppingList().then(function(shoppingList) {
		$scope.shoppingList = shoppingList;
	});
	
	$scope.buy = function(product, quantity, price) {
		if (!quantity || quantity < 1 || !price) return;
		// TODO disable buy botton
		
		purchaseService.purchase(product._id, quantity, price).then(function(result) {
			product.salesInfo.bought += quantity;
			$scope.showAlert('success', 'Bought ' + quantity + ' [' + product.name + '] with price: $' + price);
		});
	};
	
	// TODO extract to a directive
	$scope.storeMap = {
		'CW': {logo: 'CW.png', fullName: 'Chemist warehouse'},
		'CO': {logo: 'CO.png', fullName: 'Coles'},
		'PL': {logo: 'PL.jpg', fullName: 'Priceline'},
		'PO': {logo: 'PO.jpg', fullName: 'Pharmacy online'},
		'WW': {logo: 'WW.jpg', fullName: 'Woolworths'},
		'MC': {logo: 'MC.jpg', fullName: 'My chemist'}, 
		'JJ': {logo: 'JJ.gif', fullName: 'Jack and Jill'},
		'SK': {logo: 'SK.jpg', fullName: 'Sukin'},
	};
	
	$scope.storeLogo = function(store) {
		return '/images/store-logo/' + storeLogos[store];
	}
}); 