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
	rrp: Number,
	adjustedPrice: Number,
	category: [String],
	stores: {type: [ProductInStoreSchema], default: [], _id: false},
	salesInfo: {
		orderedTotal: { type: Number, default: 0 },
		orderedActive: { type: Number, default: 0 },
		inStock: { type: Number, default: 0 }
	}
});

ProcuctSchema.plugin(textSearch);
ProcuctSchema.index({name: 'text'});

ProcuctSchema.methods.adjustOrdered = function(quantity, cb) {
	if (!this.salesInfo) this.salesInfo = {};
	this.salesInfo.orderedActive += quantity;
	this.salesInfo.orderedTotal += quantity;
	this.save(cb);
};

module.exports = mongoose.model('product', ProcuctSchema);