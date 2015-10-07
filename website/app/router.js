var express  = require('express');

var ProductHandler  = require('./handlers/product-handler');
var OrderHandler  = require('./handlers/order-handler');
var BoxHandler  = require('./handlers/box-handler');
var ParcelHandler  = require('./handlers/parcel-handler');
var PriceAlertHandler  = require('./handlers/price-alert-handler');

// configuration of the router
var router = express.Router();

/* Product */
router.route('/category')
	.get(ProductHandler.getAllCategories);

router.route('/product')
	.get(ProductHandler.findProducts)
	.post(ProductHandler.createProduct);

router.route('/product/:id')
	.get(ProductHandler.getProductById)
	.post(ProductHandler.updateProduct);

router.route('/price-alert')
	.get(PriceAlertHandler.getRecentAlerts)
	.post(PriceAlertHandler.create);


/* Order */
router.route('/order')
	.get(OrderHandler.getOrders)
	.post(OrderHandler.create);

router.route('/order/:orderId')
	.post(OrderHandler.update);

router.route('/purchase')
	.post(OrderHandler.purchase);

router.route('/calc-sales-info/:infoKey')
	.get(OrderHandler.calcSalesInfo);


/* Shipping */
router.route('/box')
	.get(BoxHandler.getBoxes)
	.post(BoxHandler.create);

router.route('/box/:boxId')
	.post(BoxHandler.update);

router.route('/track-shipped-box')
	.get(BoxHandler.track);

router.route('/parcel')
	.post(ParcelHandler.create)
	.get(ParcelHandler.getAll);

router.route('/parcel/:trackingNumber')
	.put(ParcelHandler.update)
	.get(ParcelHandler.getOne)
	.delete(ParcelHandler.archive);

module.exports = router;
