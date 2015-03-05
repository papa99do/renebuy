renebuyApp.controller('ShoppingListCtrl', function($scope, orderService, purchaseService) {
	orderService.getShoppingList().then(function(shoppingList) {
		$scope.shoppingList = shoppingList;
	});
	
	$scope.buy = function(product, quantity, price) {
		if (!quantity || quantity < 1 || !price) return;
		
		purchaseService.purchase(product._id, quantity, price).then(function(result) {
			if (!product.salesInfo) product.salesInfo = {};
			product.salesInfo.inStock = (product.salesInfo.inStock || 0) + quantity;
			$scope.showAlert('success', 'Bought ' + quantity + ' [' + product.name + '] with price: $' + price);
		});
	};
	
	$scope.storeMap = {
		'CW': {logo: 'CW.png', fullName: 'Chemist warehouse'},
		'CO': {logo: 'CO.png', fullName: 'Coles'},
		'PL': {logo: 'PL.jpg', fullName: 'Priceline'},
		'PO': {logo: 'PO.jpg', fullName: 'Pharmacy online'},
		'WW': {logo: 'WW.jpg', fullName: 'Woolworths'},
		'MC': {logo: 'MC.jpg', fullName: 'My chemist'}, 
		'JJ': {logo: 'JJ.gif', fullName: 'Jack and Jill'}
	};
	
	$scope.storeLogo = function(store) {
		return '/images/store-logo/' + storeLogos[store];
	}
}); 