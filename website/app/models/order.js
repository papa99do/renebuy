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

OrderSchema.methods.revise = function(updated, deleted, name, cb) {
	if (name && name !== this.name) {
		this.name = name;
	}

	this.items.forEach(function(item) {
		var newItem = updated[item._id];
		if (newItem) {
			item.price = newItem.price;
			item.product.adjustOrdered(newItem.number - item.number);
			item.number = newItem.number;
			item.description = newItem.description;
		}
		
		if (deleted.indexOf(item._id) > -1) {
			item.product.adjustOrdered(-item.number);
		}
	});
	
	deleted.forEach(function(itemId) {
		this.items.pull(itemId);	
	});
	
	this.save(cb);
};

module.exports = mongoose.model('order', OrderSchema);