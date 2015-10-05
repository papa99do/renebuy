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
    trackingNumber: 'PE000107115GW'
  }
*/
ParcelHandler.create = function(req, res) {
  new Parcel({
    trackingNumber: req.body.trackingNumber
  }).save(respond(res));
};

ParcelHandler.getAll = function(req, res) {
  Parcel.find().select('trackingNumber recipient status sentDate')
    .sort({'sentDate': -1}).exec(respond(res));
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

    if (update.domesticNumber) {
      var cnUrl = POLAR_EXPRESS_TRACKCN_URL + update.domesticNumber;
      //console.log(cnUrl);
      request(cnUrl, function(err, response, json) {
        if (err) return handleError(err, res);
        var trackCn = JSON.parse(json);
        //console.log(trackCn);
        if (trackCn.data) {
          trackCn.data.forEach(function(data) {
            update.tracking.push({time: Date.parse(data.time), event: data.context});
          });
        }
        update.tracking.sort(byTime);

        handleUpdate(update, req, res);
      });
    } else {
        handleUpdate(update, req, res);
    }


  });
}

ParcelHandler.getOne = function(req, res) {
  Parcel.findOne({trackingNumber: req.params.trackingNumber}).exec(respond(res));
}

function handleUpdate(update, req, res) {
  update.status = 'new';
  for (var i = update.tracking.length - 1; i >= 0; i--) {
    var info = update.tracking[i];
    if (info.event.indexOf('投递并签收') > -1) {
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

  if (update.tracking.length > 0) {
    update.sentDate = update.tracking[0].time;
  }

  update.trackingNumber = req.params.trackingNumber;

  console.log(update);

  var query = {trackingNumber: req.params.trackingNumber};
  var options = {new: true};
  Parcel.findOneAndUpdate(query, update, options, respond(res));
}

var trackingInfoPatterns = [
  {pattern: /^收件人：(.*)/, handler: function(matched, info) {info.recipient = matched[1];}},
  {pattern: /^发往：(.*)/, handler: function(matched, info) {info.destination = matched[1];}},
  {pattern: /^包裹重量：([\d\.]*) KGs/, handler: function(matched, info) {info.weight = matched[1];}},
  {pattern: /^国内物流信息\[运单号：(.*)\]/, handler: function(matched, info) {info.domesticNumber = matched[1];}},
  {pattern: /^时间：([\d-]+ [\d:]+).*货物状态：(.*)/,
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
