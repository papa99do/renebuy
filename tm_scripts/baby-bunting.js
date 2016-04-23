// ==UserScript==
// @name       Baby Bunting enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Baby Bunting enhancements
// @match      http://www.babybunting.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/babybunting.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/babybunting.js
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
        var name = productElem.find('.product-name > a').attr('title').trim();
        var detailUrl = productElem.find('.product-name > a').attr('href');
        var photoUrl = productElem.find('.product-image-contents img').attr('src');
        var priceText = productElem.find('.special-price .price').text().trim();
        if (!priceText) priceText = productElem.find('.regular-price .price').text().trim();
        var price = extractNumber(/\$([0-9.]+)/, priceText);
        var rrpText = productElem.find('.old-price .price').text().trim();
        var rrp = rrpText ? extractNumber(/\$([0-9.]+)/, rrpText) : price;

        var product = {
            productId: name,
            name: name,
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl,
			store: 'BB'
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
