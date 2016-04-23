// ==UserScript==
// @name       Pharmacy online enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Pharmacy online enhancements
// @match      http://*.pharmacyonline.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/pharmacy-online.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/pharmacy-online.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.item').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var detailUrl = productElem.children('a').attr('href');
        var photoUrl = productElem.find('.product-image').attr('src');
        var id = extractNumber(/(\d+)(_\d+)?\.jpg/, photoUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price').text());
        var rrp =  extractNumber(/\$([0-9.]+)/, productElem.find('.rrp-linethrough').text());

        var product = {
            store: 'PO',
            productId: id,
            name: productElem.find('.name').text().trim(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
