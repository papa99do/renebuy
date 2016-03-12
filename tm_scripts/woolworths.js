// ==UserScript==
// @name       Woolworths enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Woolworths enhancements
// @match      *.woolworthsonline.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var WW_URL = 'http://www2.woolworthsonline.com.au';

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.product-stamp').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.name-container .description').text();
        var detailUrl = productElem.find('.name-container > a').attr('href');
        var photoUrl = productElem.find('.image-container .middle-container img').attr('src');
        var id = extractNumber(/Stockcode=(\d+)/, detailUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price-container .price').text());
        var rrpText = productElem.find('.price-container .was-price').text();
        var rrp = rrpText ? extractNumber(/\$([0-9.]+)/, rrpText) : price;

        var product = {
            productId: id,
            name: name.trim(),
            price: price,
            rrp: rrp,
            photos: [WW_URL + photoUrl],
            detailUrl: WW_URL + detailUrl,
			store: 'WW'
        };

        return product;
    }
    
    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
