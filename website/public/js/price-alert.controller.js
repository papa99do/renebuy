renebuyApp.controller('PriceAlertCtrl', function($scope, $filter, $resource, ngTableParams) {
	var PriceAlert = $resource('/api/price-alert');

	PriceAlert.query({}, function(data) {
		
		angular.forEach(data, function(alert) {
			alert.productName = alert.product.name;
		});

		$scope.tableParams = new ngTableParams({
		    page: 1,            // show first page
		    count: 10,           // count per page
				sorting: {
			    productName: 'asc'     // initial sorting
				},
		}, {
		    total: data.length, // length of data
		    getData: function($defer, params) {
					var filteredData = params.filter() ? $filter('filter')(data, params.filter()) : data;
					var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
					$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
				}
		});
	});

	$scope.storeMap = {
		'CW': {logo: 'CW.png', fullName: 'Chemist warehouse'},
		'CO': {logo: 'CO.png', fullName: 'Coles'},
		'PL': {logo: 'PL.jpeg', fullName: 'Priceline'},
		'PO': {logo: 'PO.jpg', fullName: 'Pharmacy online'},
		'WW': {logo: 'WW.jpeg', fullName: 'Woolworths'},
		'MC': {logo: 'MC.png', fullName: 'My chemist'},
		'JJ': {logo: 'JJ.jpeg', fullName: 'Jack and Jill'},
		'SK': {logo: 'SK.jpg', fullName: 'Sukin'},
		'TR': {logo: 'TR.png', fullName: 'ToysRus'},
		'BB': {logo: 'BB.png', fullName: 'Baby Bunting'},
	};

	$scope.priceDifference = function(alert) {
		return Math.abs(alert.newPrice - alert.oldPrice);
	}
});
