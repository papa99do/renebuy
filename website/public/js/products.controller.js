renebuyApp.controller('ProductCtrl', function($scope, $timeout, $resource) {
	
	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 5.1;
	$scope.ratio = 1.2;
	
	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}},
		updateCategory: {method: 'POST', params:{category: true}},
		updatePriceAdjustment: {method: 'POST', params:{priceAdjustment: true}},
		updateName: {method: 'POST', params:{name: true}},
		updateNameInChinese: {method: 'POST', params:{nameInChinese: true}},
		updateTaxType: {method: 'POST', params:{taxType: true}}
	});
	
	var defaultScrollQuery = function () {
		return {
			page: 0,
			pageSize: 20,
			busy: false,
			hasMore: true
		};
	};
	
	$scope.scroll = defaultScrollQuery();
	$scope.products = [];
	
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
			
			$timeout(function() {
				products.forEach(function(product) {
					$scope.products.push(enhance(product)); 
				});
				
				$scope.scroll.busy = false;	
			}, 500);
		});
	}
	
	$scope.search = function() {
		$scope.products = [];
		$scope.scroll = defaultScrollQuery();
		$scope.load();
	};
	
	function enhance(product) {
		
		product.buyPrice = product.stores[0].price;
		
		for(var i = 0; i < product.stores.length; i++) {
			if (product.stores[i].storeName === 'CW') {
				product.buyPrice = product.stores[i].price;
				break;
			}
		}
		
		product.categoryStr = product.category.join(" > ");
		
		return product;
	}
	
	$scope.postage = function(product) {
		return (product.isHighTax ? 12 : 10) / 1000 * (product.weight || 0);
	};
	
	$scope.reneBuyPriceInRmb = function(product) {
		var reneBuyPrice = $scope.postage(product) + product.buyPrice * $scope.ratio;
		return Math.ceil(reneBuyPrice * $scope.exchangeRate);
	};
	
	$scope.reneBuyPriceInRmbWithAdjustment = function(product) {
		return $scope.reneBuyPriceInRmb(product) + parseFloat(product.priceAdjustment);
	}
	
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
	
	$scope.updatePriceAdjustment = function(product) {
		Product.updatePriceAdjustment({id: product._id}, JSON.stringify({priceAdjustment: product.priceAdjustment}), function(result) {
			console.log('Price adjustment changed to %d for [%s]' , parseFloat(product.priceAdjustment), product.name);
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
});