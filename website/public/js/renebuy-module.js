var renebuyApp = angular.module('renebuy',
	['ui.router', 'ngResource', 'xeditable', 'treeControl', 
	'infinite-scroll', 'ui.bootstrap', 'pascalprecht.translate', 'ngTable']);

renebuyApp.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/products");
  //
  // Now set up the states
  $stateProvider
    .state('products', {
      url: "/products",
      templateUrl: "partials/products.html",
	  controller: "ProductCtrl"
    })
    .state('priceList', {
      url: "/price-list",
      templateUrl: "partials/price-list.html",
      controller: "PriceListCtrl"
    })
	.state('priceAlert', {
      url: "/price-alert",
      templateUrl: "partials/price-alert.html",
      controller: "PriceAlertCtrl"
    })
	.state('orders', {
      url: "/orders",
      templateUrl: "partials/orders.html",
      controller: "OrderCtrl"
    });
}).config(['$translateProvider', function ($translateProvider) {
  $translateProvider.translations('en', {
	MENU: {
		PRODUCTS: 'Products',
		PRICE_LIST: 'Price list',
		PRICE_ALERT: 'Price alert',
		ORDERS: 'Orders',
		TRANSLATE: '切换中文',
		EDIT_MODE: 'Toggle edit mode'
	},
	P: {
		CATEGORY: 'Category',
		RRP: 'RRP',
		WEIGHT: 'Weight',
		HIGH_TAX: 'High tax',
		LOW_TAX: 'Low tax',
		POSTAGE: 'Postage',
		CALC_PRICE: 'Calculated price',
		ADJ_PRICE: 'Adjusted price',
		PROFIT: 'Profit',
		TAOBAO_PRICE: 'Taobao price indicator',
		PRICE_IN_STORES: 'Price in stores',
		LOWEST_PRICE: 'Lowest'
	},
	PL: {
		PRICE_LIST_FOR: 'Price list for',
		CATEGORY: 'Category',
		PRODUCT_NAME: 'Name',
		CHINESE_NAME: 'Name(Chinese)',
		PRICE: 'Price',
		POSTAGE: 'Postage',
		COST_D: 'Cost$',
		COST_R: 'Cost¥',
		CALC_PRICE: 'Price+20%',
		ADJ_PRICE: 'My price',
		PROFIT: 'Profit',
		EXPORT: 'Export to Excel'
	}
    
  });
 
  $translateProvider.translations('ch', {
	MENU: {
		PRODUCTS: '产品列表',
		PRICE_LIST: '分类报价单',
		PRICE_ALERT: '价格提醒',
		ORDERS: '订单管理',
		TRANSLATE: '切换英文',
		EDIT_MODE: '切换编辑模式'
	},
	P: {
		CATEGORY: '类目',
		RRP: '零售价',
		WEIGHT: '重量',
		HIGH_TAX: '高税',
		LOW_TAX: '低税',
		POSTAGE: '运费',
		CALC_PRICE: '自动报价',
		ADJ_PRICE: '小象报价',
		PROFIT: '利润',
		TAOBAO_PRICE: '淘宝价格参考',
		PRICE_IN_STORES: '各家店价格比较',
		LOWEST_PRICE: '最低价'
	},
	PL: {
		PRICE_LIST_FOR: '报价单',
		CATEGORY: '类目',
		PRODUCT_NAME: '产品名称',
		CHINESE_NAME: '中文名称',
		PRICE: '价格',
		POSTAGE: '运费',
		COST_D: '成本$',
		COST_R: '成本¥',
		CALC_PRICE: '自动报价',
		ADJ_PRICE: '小象报价',
		PROFIT: '利润',
		EXPORT: '导出'
	}
  });
 
  $translateProvider.preferredLanguage('en');
}]);