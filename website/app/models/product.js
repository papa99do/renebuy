var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
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
	stores: {type: [ProductInStoreSchema], default: [], _id: false}
});

ProcuctSchema.plugin(textSearch);
ProcuctSchema.index({ name: 'text' });

module.exports = mongoose.model('product', ProcuctSchema);