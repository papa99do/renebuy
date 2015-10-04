var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ParcelSchema = new Schema({
	trackingNumber: {type: String, unique: true, required: true}
});

module.exports = mongoose.model('parcel', ParcelSchema);
