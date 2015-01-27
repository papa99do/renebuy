var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PriceAlertSchema = new Schema({
	product: {type: Schema.Types.ObjectId, ref: 'product'},
	store: String,
	oldPrice: Number,
	newPrice: Number,
	rrp: Number,
	alertDate: {type: Date, default: Date.now},
	alertType: String
});

module.exports = mongoose.model('priceAlert', PriceAlertSchema);