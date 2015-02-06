/* Dependencies: you need loglevel, request and cheerio
   Usage:
var smartRequest = require('./smart-request')(10);
smartRequest(url, callback, errorCallback, {raw: true});
*/

var request = require('request');
var cheerio = require('cheerio');
var log = require('loglevel');

var smartRequest = function(maxParallelConnection, retryInterval, coolingDownInterval, allDoneCallback) {

maxParallelConnection = maxParallelConnection || 5;
coolingDownInterval = (coolingDownInterval || 600) * 1000;
retryInterval = (retryInterval || 5) * 1000; 
var activeRequestCount = 0;
var callbackCount = 0;
var coolingDown = false;

/**
 * Handle http errors, initiate cheerio with the retrieved html file
 * Throttling, and count down
 */
return function smartRequestInternal(url, opt, callback, errorCallback) {
	function retryIn(milliSeconds) {
		callbackCount++;
		setTimeout(function(){
			smartRequestInternal(url, opt, callback, errorCallback);
			callbackCount--;
		}, milliSeconds);
	}
	
	var coolingDownTimeout;
	function coolDownIn(milliSeconds) {
		clearTimeout(coolingDownTimeout);
		coolingDown = true;
		log.debug("Cooling down in %d seconds...", milliSeconds / 1000);
		coolingDownTimeout = setTimeout(function() {
			coolingDown = false;
		}, milliSeconds);
	}
	
	if (coolingDown) {
		retryIn(coolingDownInterval);
		return;
	}
	
	if (activeRequestCount >= maxParallelConnection) {
		retryIn(retryInterval);
		return;
	}
	
	if (!url) return;
	
	activeRequestCount++
	log.debug('Retrieving content for %s, total conns: %d', url, activeRequestCount);
	
	request(url, function(error, response, html) {
		//log.info(html);
		
		activeRequestCount--;
		log.debug('Retrieved content for %s, total conns', url, activeRequestCount);
		
		if (error || response.statusCode !== 200) {
			log.error('ERROR:', url, error, response && response.statusCode);
			return;
		}
	
		callbackCount++;
		//log.debug('Callback count: ', callbackCount);
		var $ = opt && opt.raw ? html : cheerio.load(html);
		try {
			callback($);
		} catch (err) {
			log.error(url, err);
			
			var errorHandler = errorCallback && errorCallback($, err) || {};
			
			if (errorHandler.coolDown) {
				coolDownIn(coolingDownInterval);
			}
			
			if (errorHandler.retry) {
				var retryTime = errorHandler.retryInSeconds ? errorHandler.retryInSeconds * 1000 : retryInterval;  
				log.debug("Will retry %s in %d seconds", url, retryTime / 1000);
				retryIn(retryTime);
			}
			
		}
		callbackCount--;
		log.debug('Callback count: ', callbackCount);
		if (callbackCount === 0 && activeRequestCount === 0) {
			log.info("All callback done and no active request, time to rest!");
			allDoneCallback && allDoneCallback();
		}
		
	});
};

};

module.exports = smartRequest;