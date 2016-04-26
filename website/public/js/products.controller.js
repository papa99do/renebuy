renebuyApp.controller('ProductCtrl', function($scope, $timeout, $resource, $modal, $http) {

	$scope.exchangeRate = 5.5;
	$scope.realTimeExchangeRate = 4.5;
	$scope.ratio = 1.2;

	var Product = $resource('/api/product/:id', {id: '@id'}, {
		updateWeight: {method: 'POST', params:{weight: true}},
		updateCategory: {method: 'POST', params:{category: true}},
		updatePolarCategory: {method: 'POST', params:{polarCategory: true}},
		updateName: {method: 'POST', params:{name: true}},
		updateNameInChinese: {method: 'POST', params:{nameInChinese: true}},
		updateRrp: {method: 'POST', params:{rrp: true}},
		updateTaxType: {method: 'POST', params:{taxType: true}},
		toggleWatchPriceFlag: {method: 'POST', params: {watchPrice: true}},
		getNewPrices: {method: 'GET', params: {newPrice: true}},
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

	$scope.shouldLoad = function () {
		return $scope.scroll.hasMore && !$scope.scroll.busy;
	};

	$scope.load = function() {
		console.log('Loading products: %d - %d', $scope.scroll.page * $scope.scroll.pageSize + 1,
		 	($scope.scroll.page + 1) * $scope.scroll.pageSize);

		$scope.scroll.busy = true;
		Product.query({q: $scope.searchText, p: $scope.scroll.page, ps: $scope.scroll.pageSize, bestselling:$scope.bestselling}, function(products) {
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

	$scope.listBestsellings = function() {
		$scope.searchText = null;
		$scope.bestselling = true;
		$scope.search();
	}

	$scope.listLatest = function() {
		$scope.searchText = null;
		$scope.bestselling = null;
		$scope.search();
	}

	function enhance(product) {

		product.buyPrice = product.stores[0] ? product.stores[0].price : product.rrp;
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
		product.polarCategory = product.polarCategory || {};

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

	$scope.updatePolarCategory = function(product) {
		console.log('Updating polarCategory to ', product.polarCategory);
		Product.updatePolarCategory({id: product._id}, JSON.stringify({polarCategory: product.polarCategory}), function(result) {
			console.log('Polar category changed to: %s for [%s]', product.polarCategory.sub, product.name);
			$scope.showAlert('success', 'Polar category has been updated');
		});
	};

	$scope.updateNameInChinese = function(product) {
		Product.updateNameInChinese({id: product._id}, JSON.stringify({nameInChinese: product.nameInChinese}), function(result) {
			console.log('Chinese name changed to %s for [%s]' , product.nameInChinese, product.name);
		});
	};

	$scope.updateRrp = function(product) {
		Product.updateRrp({id: product._id}, JSON.stringify({rrp: product.rrp}), function(result) {
			console.log('RRP changed to %s for [%s]' , product.rrp, product.name);
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

	$scope.toggleWatchPriceFlag = function(product) {
		Product.toggleWatchPriceFlag({id: product._id}, JSON.stringify({watchPrice: !product.watchPrice}), function(result) {
			product.watchPrice = !product.watchPrice;
			console.log('Toggled watch price flag for %s', product.name);
		});
	};

	$scope.getNewPrices = function(product) {
		product.updatingPrice = true;
		Product.getNewPrices({id: product._id}, function(newPriceMap) {
			//console.log('New prices: ', newPriceMap);
			product.stores.forEach(function(store) {
				if (newPriceMap[store.storeName]) {
					store.price = newPriceMap[store.storeName].newPrice;
					if (store.lowestPrice > store.price) {
						store.lowestPrice = store.price;
					}
				}
			});
			enhance(product);
			product.lastPriceUpdated = new Date();
			product.updatingPrice = false;
		});
	}

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

	$scope.storeLogo = function(store) {
		return '/images/store-logo/' + storeLogos[store];
	};

	$scope.openOrderModal = function(product) {
		$modal.open({
			templateUrl: 'orderModal.html',
			controller: 'OrderModalCtrl',
			resolve: {
			    product: function () {
					product.adjustedPrice = $scope.adjustedPrice(product);
			        return product;
			    },
				showAlert: function() {
					return $scope.showAlert;
				}
			}
		});
	};

	// for typeahead
	Product.query({suggest: true}, function(products) {
		var productNames = products.map(function(p) {return p.name + '(' + p.nameInChinese + ')'});
		$scope.engine = new Bloodhound({
			name: 'products',
			local: products,
			datumTokenizer: function(p) {
				var nameTokens = Bloodhound.tokenizers.whitespace(p.name);
				// tokenize Chinese characters and nameInChinese
				var nameInChineseTokens = [];
				if (p.nameInChinese) {
					nameInChineseTokens = p.nameInChinese.split('');
					nameInChineseTokens.push(p.nameInChinese);
				}
				return nameTokens.concat(nameInChineseTokens);
			},
   		queryTokenizer: Bloodhound.tokenizers.whitespace
		});

		$scope.engine.initialize();
	});

	$scope.suggesttedName = function(product) {
		if (!product) return '';
		return product.name + ' (' + product.nameInChinese + ')';
	};


	// polar express category
	$http.get('polar/polar-cates.json').then(function(res){
			//console.log("polar categories", res.data);
			$scope.polarCates = res.data;
  });

	$scope.polarSubCates = function(topCate) {
		return $scope.polarCates[topCate] || [];
	};

}).controller('OrderModalCtrl', function($scope, $modalInstance, product, showAlert, orderService) {

	orderService.getActiveOrderNames().then(function(result) {
		$scope.activeOrderNames = result;
	});

	$scope.product = product;
	$scope.item = {
		productId: product._id,
		price: product.adjustedPrice,
		number: 1,
		description: ''
	};

	$scope.addToOrder = function () {
		console.log($scope.item);
		orderService.addOrderItem($scope.item).then(function() {
			showAlert('success', 'Item has been added');
			$modalInstance.close();
		});
	};

	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
});
