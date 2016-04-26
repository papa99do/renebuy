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
	isHighTax: Boolean,
	watchPrice: Boolean,
	rrp: Number,
	adjustedPrice: Number,
	category: [String],
	polarCategory: {
		top: String,
		sub: String
	},
	stores: {type: [ProductInStoreSchema], default: [], _id: false},
	salesInfo: {
		ordered: { type: Number, default: 0 },
		sold: { type: Number, default: 0 },
		bought: { type: Number, default: 0 }
	}
});

ProcuctSchema.plugin(textSearch);
ProcuctSchema.index({name: 'text'});

ProcuctSchema.methods.order = function(quantity, cb) {
	this.salesInfo.ordered += quantity;
	this.save(cb);
};

module.exports = mongoose.model('product', ProcuctSchema);
