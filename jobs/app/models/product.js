var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var Schema = mongoose.Schema;

var ProductInStoreSchema = new Schema({
	storeName: String,
	productId: String,
	detailUrl: String,
	price: Number,
	lowestPrice: Number
}, {_id: false});

var ProcuctSchema = new Schema({
	name: {type: String, unique: true, required: true},
	nameInChinese: String,
	photos: {type: [String], default: []},
	weight: Number,
	rrp: Number,
	category: [String],
	stores: {type: [ProductInStoreSchema], default: [], _id: false}
});

ProcuctSchema.plugin(textSearch);
ProcuctSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('product', ProcuctSchema);