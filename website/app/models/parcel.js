var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ParcelSchema = new Schema({
	trackingNumber: {type: String, unique: true, required: true},
	domesticNumber: String,
  status: {type: String, default: 'new'},
  recipient: String,
  destination: String,
  weight: Number,
	sentDate: {type: Date, default: Date.now},
  tracking: { type: [{time: Date, event: String, _id: false}], default: []}
});

module.exports = mongoose.model('parcel', ParcelSchema);
