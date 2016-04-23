// ==UserScript==
// @name       Priceline enhancements
// @namespace  http://yihanzhao.com/
// @version    0.2
// @description Priceline enhancements
// @match      https://www.priceline.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/priceline.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/priceline.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var PL_URL = "https://www.priceline.com.au";

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.item').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.product-name > a').attr('title');
        var detailUrl = productElem.find('.product-name > a').attr('href');
        var photoUrl = productElem.find('.product-image-container img').attr('src');
        var id = extractNumber(/(\d+)/, productElem.find('button').attr('data-product-id'));
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price-box .price').text());
        var rrp = price;

        var product = {
            productId: id,
            name: name.trim(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl,
			store: 'PL'
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
