renebuyApp.controller('PriceListCtrl', function($scope, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.2;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		adjustPrice: {method: 'POST', params:{adjustPrice: true}}
	});
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
		
		product.buyPrice = product.stores[0].price;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
				break;
			}
		}
		
		product.postage = (product.isHighTax ? 12 : 10) / 1000 * (product.weight || 0);
		product.cost = product.buyPrice + product.postage;
		product.costInRmb = Math.ceil(product.cost * $scope.exchangeRate);
		product.reneBuyPriceInRmb = Math.ceil((product.postage + product.buyPrice * $scope.ratio) * $scope.exchangeRate);
		product.adjusted = !!product.adjustedPrice;
		product.adjustedPrice = product.adjustedPrice || product.reneBuyPriceInRmb;
		
		if ($scope.categoryMap[product.category[2]] === undefined) {
			$scope.categoryMap[product.category[2]] = [];
		}
		
		$scope.categoryMap[product.category[2]].push(product);
		
	}
	
	$scope.profit = function(product) {
		return product.adjustedPrice - product.costInRmb;
	};
	
	$scope.adjustPrice = function(product) {
		Product.adjustPrice({id: product._id}, JSON.stringify({adjustedPrice: product.adjustedPrice}), function(result) {
			product.adjusted = true;
			console.log('Price adjusted to %.2f for [%s]', product.adjustedPrice, product.name);
		});
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