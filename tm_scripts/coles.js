// ==UserScript==
// @name       Coles enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Coles enhancements
// @match      http://shop.coles.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/coles.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/coles.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var CO_URL = 'http://shop.coles.com.au'

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.prodtile').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.detail .brand').text() + ' ' + productElem.find('.detail .item a').text();
        var detailUrl = productElem.find('.product-url').attr('href');
        var photoUrl = productElem.find('.product-url img').attr('src');
        var id = extractNumber(/(\d+)/, productElem.find('form').attr('id'));
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price').text());
        var rrpText = productElem.find('.saving').text().trim();
        var rrp = rrpText ? extractNumber(/was \$([0-9.]+)/, rrpText) : price;

        var product = {
            productId: id,
            name: name.replace(/\s+/g, ' ').trim(),
            price: price,
            rrp: rrp,
            photos: [CO_URL + photoUrl],
            detailUrl: detailUrl,
			store: 'CO'
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
