var async = require('async');
var request = require('request');
var cheerio = require('cheerio');

var Parcel = require('../models/parcel');

var POLAR_EXPRESS_URL = 'http://www.polarexpress.com.au/track?num=';
var POLAR_EXPRESS_TRACKCN_URL = 'http://www.polarexpress.com.au/api/track_cn?com=ems&num=';

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
    "trackingNumber": "PE000275384GW",
    "sentDate": "2016-04-30T00:05:10.000Z",
    "weight": "3.50",
    "totalQuantity": "3",
    "recipient": "钱程",
    "destination": "（ 钱程  13376255122  江苏，常州，公园路18号云庭A座3105）",
    "itemDetails": [
      {
        "name": "Aptamil 金装 婴儿奶粉4段 k4",
        "quantity": 3
      }
    ]
  }
*/
ParcelHandler.create = function(req, res) {
  Parcel.findOne({trackingNumber: req.body.trackingNumber}).exec(function (err, parcel) {
    if (err) return handleError(err, res);
    if (parcel) {
      res.status(409).send('Parcel ' + parcel.trackingNumber + ' already exists');
    } else {
      new Parcel(req.body).save(respond(res));
    }
  });
};

ParcelHandler.getAll = function(req, res) {
  Parcel.find({status: {$ne: 'archived'}}).sort({'sentDate': -1}).exec(respond(res));
};

ParcelHandler.update = function(req, res) {

  var url = POLAR_EXPRESS_URL + req.params.trackingNumber;
  //var mockUrl = 'http://localhost:3001/mocks/polar-express-tracking.html';
  //var mockCNUrl = 'http://localhost:3001/mocks/polar-express-trackcn.json';

  request(url, function(err, response, html) {
    if (err) return handleError(err, res);
    var $ = cheerio.load(html);
    var tracking = $('div.formTable3').text().split(/\n/).map(trim).filter(truthy);
    var update = extractInfo(tracking);

    handleUpdate(update, req, res);

  });
};

ParcelHandler.archive = function(req,res) {
  Parcel.findOneAndUpdate({trackingNumber: req.params.trackingNumber},
    {status: 'archived'}, {new: true}, respond(res));
};

ParcelHandler.getOne = function(req, res) {
  Parcel.findOne({trackingNumber: req.params.trackingNumber}).exec(respond(res));
};

function handleUpdate(update, req, res) {
  update.status = 'shipped';
  for (var i = update.tracking.length - 1; i >= 0; i--) {
    var info = update.tracking[i];
    if (info.event.indexOf('已签收') > -1) {
      update.status = 'delivered';
      break;
    } else if (info.event.indexOf('转接国内') > -1) {
      update.status = 'domestic';
      break;
    } else if (info.event.indexOf('清关中') > -1) {
      update.status = 'custom';
      break;
    }
  }

  console.log(update);

  var query = {trackingNumber: req.params.trackingNumber};
  var options = {new: true};
  Parcel.findOneAndUpdate(query, update, options, respond(res));
}

var trackingInfoPatterns = [
  {pattern: /^国内物流信息\[运单号：(.*)\]/, handler: function(matched, info) {info.domesticNumber = matched[1];}},
  {pattern: /^时间：([\d-]+ [\d:]+).*状态：(.*)/,
   handler: function(matched, info) {
    info.tracking.push({time: Date.parse(matched[1]), event: matched[2]});
  }},
]

function extractInfo(tracking) {
  var info = {tracking: []};
  tracking.forEach(function(row) {
    var matched = null;
    trackingInfoPatterns.forEach(function(pattern) {
      if (!matched && (matched = row.match(pattern.pattern))) {
        pattern.handler(matched, info);
      }
    });
  });
  return info;
}

function trim(str) {
  return str.trim();
}

function truthy(value) {
  return !!value;
}

function byTime(a, b) {
  return a.time - b.time;
}

module.exports = ParcelHandler;
