renebuyApp.controller('PriceListCtrl', function($scope, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.2;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product');
	var Category = $resource('/api/category');
	
	$scope.search = function(categoryFullName, detail, $event) {
		console.log('search prices for ', categoryFullName);
		$scope.categoryMap = {};
		$scope.category = categoryFullName;
		$scope.detail = detail;
		Product.query({category : $scope.category}, function(products) {
			products.forEach(function(product) {enhance(product);});
			$scope.priceListFetched = true;
		});
		$event.stopPropagation();
	};
		
	$scope.treeOptions = {
	    nodeChildren: "children",
	    dirSelectable: false
	};
	
	$scope.showSelected = function(sel) {
		$scope.selectedNode = sel;
	};
	
	Category.query(function(result) {
		$scope.categoryTree = result;		
	});
	
	function enhance(product) {
		product.unitPostage = product.isHighTax ? 12 : 10;
		
		product.buyPrice = product.stores[0].price;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
				break;
			}
		}
		
		if ($scope.categoryMap[product.category[2]] === undefined) {
			$scope.categoryMap[product.category[2]] = [];
		}
		
		$scope.categoryMap[product.category[2]].push(product);
		
	}
	
	$scope.postage = function(product) {
		return product.unitPostage / 1000 * (product.weight || 0);
	};
	
	$scope.cost = function(product) {
		return product.buyPrice + $scope.postage(product);
	};
	
	$scope.costInRmb = function(product) {
		return Math.ceil((product.buyPrice + $scope.postage(product)) * $scope.exchangeRate);
	};
	
	$scope.reneBuyPriceInRmb = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	};
	
	$scope.reneBuyPriceInRmbWithAdjustment = function(product) {
		return $scope.reneBuyPriceInRmb(product) + parseFloat(product.priceAdjustment);
	};
	
	$scope.profit = function(product) {
		return $scope.reneBuyPriceInRmbWithAdjustment(product) - $scope.costInRmb(product);
	};
	
	$scope.tableToExcel = (function () {
	    var uri = 'data:application/vnd.ms-excel;base64,',
	        template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
	        base64 = function (s) {
	            return window.btoa(unescape(encodeURIComponent(s)))
	        }, 
			format = function (s, c) {
	            return s.replace(/{(\w+)}/g, function (m, p) {
	                return c[p];
	            })
	        };
		
	    return function () {
	        var table = document.getElementById('priceTable'),
				name = 'Price list ' + $scope.category,
				filename = 'price-list.xls';
				
	        var ctx = {
	            worksheet: name,
	            table: table.innerHTML
	        };
	    	document.getElementById("dlink").href = uri + base64(format(template, ctx));
	        document.getElementById("dlink").download = filename;
	        document.getElementById("dlink").click();
	    };
	})();
	
});