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
			    alertType: 'asc'     // initial sorting
			},
		}, {
		    total: data.length, // length of data
		    getData: function($defer, params) {
				var filteredData = params.filter() ? $filter('filter')(data, params.filter()) : data;
				console.log('filtered: ', filteredData);
				var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
				console.log('ordered: ', orderedData);
		        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		    }
		});
	});
	
	var alertTypeMap = {
		'low': {rowClass: 'info'},
		'up': {rowClass: 'danger'},
		'down': {rowClass: 'success'}
	}
	
	$scope.rowClass = function(alertType) {
		return alertTypeMap[alertType].rowClass;
	}
});