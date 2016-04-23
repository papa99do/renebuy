// ==UserScript==// ==UserScript==
// @name       Sukin enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Sukin enhancements
// @match      http://www.sukinorganics.com/Product/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/sukin.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/sukin.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var SK_URL = 'http://www.sukinorganics.com';

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.columnRight').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.prodGallery img').attr('alt');
        var detailUrl = $(location).attr('pathname');
        var photoUrl = productElem.find('.prodGallery img').attr('src');
        var id = extractNumber(/\/(\d+)\//, detailUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('#priceField').text());

        var product = {
            productId: id,
            name: name,
            price: price,
            rrp: price,
            photos: [SK_URL + photoUrl],
            detailUrl: SK_URL + detailUrl,
			store: 'SK'
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
