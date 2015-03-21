var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BoxSchema = new Schema({
	name: String,
	status: { type: String, default: 'new' },  /*'new', 'shipped', 'received' */
	recipient: String,
	trackingNumber: String,
	items: { type: [{
		orderItemId: String,
		quantity: Number,
		_id: false
	}], default: []}, 
	shippedDate: {type: Date},
	receivedDate: {type: Date},
	createdDate: {type: Date, default: Date.now},
});

module.exports = mongoose.model('box', BoxSchema);