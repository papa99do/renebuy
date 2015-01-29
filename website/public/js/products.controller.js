renebuyApp.controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}},
		updateCategory: {method: 'POST', params:{category: true}},
		updateName: {method: 'POST', params:{name: true}},
		updateNameInChinese: {method: 'POST', params:{nameInChinese: true}},
		updateTaxType: {method: 'POST', params:{taxType: true}}
	});
	
	var defaultScrollQuery = function () {
		return {
			page: 0,
			pageSize: 24,
			busy: false,
			hasMore: true
		};
	};
	
	$scope.scroll = defaultScrollQuery();
	$scope.products = [];
	
	// for typeahead
	$scope.productNames = [];
	Product.query({suggest: true}, function(products) {
		$scope.productNames = products.map(function(p) {return p.name + '(' + p.nameInChinese + ')'});
	});

	$scope.shouldLoad = function () {
		return $scope.scroll.hasMore && !$scope.scroll.busy;
	};
	
	$scope.load = function() {
		console.log('Loading products: %d - %d', $scope.scroll.page * $scope.scroll.pageSize + 1,
		 	($scope.scroll.page + 1) * $scope.scroll.pageSize);
		
		$scope.scroll.busy = true;
		Product.query({q: $scope.searchText, p: $scope.scroll.page, ps: $scope.scroll.pageSize}, function(products) {
			$scope.scroll.hasMore = products.length > $scope.scroll.pageSize;
			if ($scope.scroll.hasMore) {
				$scope.scroll.page++;
				products.splice(-1, 1);
			}
			
			products.forEach(function(product) {
				$scope.products.push(enhance(product)); 
			});
				
			$scope.scroll.busy = false;	
		});
	}
	
	$scope.search = function() {
		$scope.products = [];
		$scope.scroll = defaultScrollQuery();
		$scope.load();
	};
	
	$scope.searchCategory = function(category) {
		$scope.searchText = 'c:' + category;
		$scope.search();
	}
	
	function enhance(product) {
		
		product.buyPrice = product.stores[0].price;
		product.isLowPrice = false;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
			}
			if (product.stores[i].price / product.rrp < 0.6) {
				product.isLowPrice = true;
			}
		}
		
		product.categoryStr = product.category.join(" > ");
		
		return product;
	}
	
	$scope.postage = function(product) {
		return (product.isHighTax ? 12 : 10) / 1000 * (product.weight || 0);
	};
	
	$scope.costInRmb = function(product) {
		return Math.ceil((product.buyPrice + $scope.postage(product)) * $scope.exchangeRate);
	};
	
	$scope.calculatedPrice = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	};
	
	$scope.adjustedPrice = function(product) {
		return product.adjustedPrice || $scope.calculatedPrice(product);
	};
	
	$scope.calculatedProfit = function(product) {
		return $scope.calculatedPrice(product) - $scope.costInRmb(product);
	}
	
	$scope.adjustedProfit = function(product) {
		return $scope.adjustedPrice(product) - $scope.costInRmb(product);
	};
	
	$scope.updateWeight = function(product) {
		Product.updateWeight({id: product._id}, JSON.stringify({weight: product.weight}), function(result) {
			console.log('Weight changed to: %dg for [%s]', parseInt(product.weight), product.name);
		});	
	};
	
	$scope.updateCategory = function(product) {
		Product.updateCategory({id: product._id}, JSON.stringify({category: product.categoryStr}), function(result) {
			console.log('Category changed to: %s for [%s]', product.categoryStr, product.name);
		});
	};
	
	$scope.updateNameInChinese = function(product) {
		Product.updateNameInChinese({id: product._id}, JSON.stringify({nameInChinese: product.nameInChinese}), function(result) {
			console.log('Chinese name changed to %s for [%s]' , product.nameInChinese, product.name);
		});
	};	
	
	$scope.updateName = function(product) {
		Product.updateName({id: product._id}, JSON.stringify({name: product.name}), function(result) {
			console.log('Name changed to %s', product.name);
		});
	};
	
	$scope.updateTaxType = function(product) {
		Product.updateTaxType({id: product._id}, JSON.stringify({isHighTax: product.isHighTax}), function(result) {
			console.log('Tax type changed to %s for [%s]', product.isHighTax ? 'high' : 'low', product.name);
		});
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