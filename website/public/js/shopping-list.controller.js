renebuyApp.controller('ShoppingListCtrl', function($scope, orderService) {
	orderService.getShoppingList().then(function(result) {
		$scope.shoppingList = result;
	});
	
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