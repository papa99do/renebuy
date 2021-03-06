renebuyApp
.factory('deliveryService', function($resource, $http) {
	var Boxes = $resource('/api/box');
	var Box = $resource('/api/box/:boxId', {boxId: '@boxId'}, {
		ship: {method: 'POST', params:{ship: true}},
		receive: {method: 'POST', params:{receive:true}}
	});

	var Parcels = $resource('/api/parcel');
	var Parcel = $resource('/api/parcel/:trackingNumber', {trackingNumber: '@trackingNumber'}, {
		track: {method: 'PUT'},
		archive: {method: 'DELETE'}
	});


	return {
		getActiveBoxes: function() {
			return Boxes.query().$promise;
		},
		saveBox: function(box) {
			return box._id ? Box.save({boxId: box._id}, box).$promise : Boxes.save(box).$promise;
		},
		shipBox: function(box) {
			return Box.ship({boxId: box._id}, {
				dateShipped: box.dateShipped,
				recipient: box.recipient,
				trackingNumber: box.trackingNumber
			}).$promise;
		},
		receiveBox: function(boxId, dateReceived) {
			return Box.receive({boxId: boxId}, {dateReceived: dateReceived}).$promise;
		},
		getActiveParcels: function() {
			return Parcels.query().$promise;
		},
		trackParcel: function(trackingNumber) {
			return Parcel.track({trackingNumber: trackingNumber}).$promise;
		},
		archiveParcel: function(trackingNumber) {
			return Parcel.archive({trackingNumber: trackingNumber}).$promise;
		}
	}
})
.factory('orderService', function($resource, $q) {
	var Orders = $resource('/api/order');
	var Order = $resource('/api/order/:orderId', {orderId: '@orderId'}, {
		ship: {method: 'POST', params:{ship: true}},
		fulfill: {method: 'POST', params:{fulfill: true}}
	});

	return {
		addOrderItem: function(item) {
			return Orders.save(item).$promise;
		},
		getActiveOrderNames: function() {
			return Orders.query({activeName: true}).$promise;
		},
		getActiveOrders: function() {
			return Orders.query({active: true}).$promise;
		},
		getShippingOrders: function() {
			return Orders.query({shipping: true}).$promise;
		},
		getShoppingList: function() {
			return Orders.query({shoppingList: true, details: true}).$promise;
		},
		updateOrder: function(orderId, deleted, updated, name) {
			return Order.save({orderId: orderId}, {deleted: deleted, updated: updated, name: name}).$promise;
		},
		shipOrder: function(order) {
			return Order.ship({orderId: order._id}).$promise;
		},
		fulfillOrder: function(order) {
			return Order.fulfill({orderId: order._id}).$promise;
		}
	}
})
.factory('purchaseService', function($resource) {
	var Purchases = $resource('/api/purchase');

	return {
		purchase: function(productId, quantity, price) {
			return Purchases.save({productId: productId, price: price, quantity: quantity}).$promise;
		}
	};
})
.factory('excelService', function($templateCache) {
	var uri = 'data:application/vnd.ms-excel;base64,',
        template = $templateCache.get('excelTemplate.html'),
        base64 = function (s) {
            return window.btoa(unescape(encodeURIComponent(s)))
        },
		format = function (s, c) {
            return s.replace(/{(\w+)}/g, function (m, p) {
                return c[p];
            });
        };

	return {
		exportExcel: function(fileName, worksheetName, tableHtml) {
			var context = {
				worksheet: worksheetName,
				table: tableHtml
			};
			var href = uri + base64(format(template, context));
			// $('#' + linkElemId).attr('href', href).attr('download', fileName).trigger('click');
			var linkElem = document.getElementById('exportLink');
			linkElem.href = href;
	        linkElem.download = fileName;
	        linkElem.click();
		}
	};
})
.controller('MainCtrl', function($scope, $translate, $timeout) {
	$scope.editMode = false;
	$('.navbar-collapse a').click(function(){
	    $(".navbar-collapse").collapse('hide');
	});

	$scope.lang = 'en';
	$scope.changeLang = function() {
		$scope.lang = ($scope.lang === 'en' ? 'ch' : 'en');
		$translate.use($scope.lang);
	}

	$scope.alert = null;
	$scope.showAlert = function(type, msg) {
		$scope.alert = {type: type, msg: msg};
		$timeout(function() {
			$scope.alert = null;
		}, 2000);
	}
})
.filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
	    return $filter('number')(input * 100, decimals) + '%';
	};
}])
.directive('safeInput', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            element.bind('click', function (event) {
                event.stopPropagation();
				event.preventDefault();
            });
        }
    };
})
.run(function(editableOptions, editableThemes) {
  	editableThemes.bs3.inputClass = 'input-sm';
  	editableThemes.bs3.buttonsClass = 'btn-sm';
  	editableOptions.theme = 'bs3';
});
