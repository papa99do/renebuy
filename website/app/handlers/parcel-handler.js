var async = require('async');

var Parcel = require('../models/parcel');

var ParcelHandler = {};

function handleError(err, res) {
  console.error(err);
  var statusCode = err.statusCode || 500;
  var errorMessage = err.message || err;
  res.status(statusCode).send(errorMessage);
}

function handleResult(result, res) {
  res.json(result);
}

function respond(res) {
  return function(err, result) {
    if (err) return handleError(err, res);
    handleResult(result, res);
  };
}

/* Create new parcel:
  {
    trackingNumber: 'PE000107115GW'
  }
*/
ParcelHandler.create = function(req, res) {
  new Parcel({
    trackingNumber: req.body.trackingNumber
  }).save(respond(res));
};

ParcelHandler.getAll = function (req, res) {
  Parcel.find({}).exec(respond(res));
};

module.exports = ParcelHandler;
