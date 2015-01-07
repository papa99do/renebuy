var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductInStoreSchema = new Schema({
	storeName: String,
	productId: String,
	detailUrl: String,
	prices: [Number],
	rrp: Number,
	lastUpdatedAt: Date
}, {_id: false});

var ProcuctSchema = new Schema({
	name: {type: String, unique: true, required: true},
	nameInChinese: String,
	photos: {type: [String], default: []},
	weight: Number,
	stores: {type: [ProductInStoreSchema], default: []}
});

module.exports = mongoose.model('product', ProcuctSchema);