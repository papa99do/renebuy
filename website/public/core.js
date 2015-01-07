var app = angular.module('main', ['ngTable', 'ngResource']).
controller('ProductCtrl', function($scope, $timeout, $resource, ngTableParams) {
	
	var Api = $resource('/api/products');
	
	Api.query(function(products) {
		$scope.products = products;
	});

/*
    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: 0, // length of data
        getData: function($defer, params) {
            Api.query(function(data) {
				$timeout(function() {
					console.log(data.length, data[0].title);
					params.total(data.length);
					$defer.resolve(data);
				}, 500);
			});
        }
    });
*/
});