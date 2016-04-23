// ==UserScript==
// @name       ToysRus enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description ToysRus enhancements
// @match      http://www.toysrus.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/toysrus.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/toysrus.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.PFProductContainer').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.productShortDescription > a').text();
        var detailUrl = productElem.find('.productShortDescription > a').attr('href');
        var photoUrl = productElem.find('.productImageCell img').attr('src');
        var id = extractNumber(/(\d+)/, productElem.find('input[name=productid]').attr('value'));
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price').text());
        var rrpText = productElem.find('.preSalePrice').text().trim();
        var rrp = rrpText ? extractNumber(/\$([0-9.]+)/, rrpText) : price;

        var product = {
            productId: id,
            name: name.trim(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl,
			store: 'TR'
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
