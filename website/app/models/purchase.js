var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PurchaseSchema = new Schema({
	product: {type: Schema.Types.ObjectId, ref: 'product'},
	price: Number,
	quantity: Number,
	quantityInStock: Number,
	purchaseDate: {type: Date, default: Date.now},
});

module.exports = mongoose.model('purchase', PurchaseSchema);