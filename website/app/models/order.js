var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderItemSchema = new Schema({
	product: {type: Schema.Types.ObjectId, ref: 'product'},
	price: Number,
	number: Number,
	description: String
});

var OrderSchema = new Schema({
	name: {type: String, unique: true, required: true},
	status: {type: String, default:'active'},
	createdDate: {type: Date, default: Date.now},
	items: {type: [OrderItemSchema], default: []}
});

module.exports = mongoose.model('order', OrderSchema);