// ==UserScript==
// @name       Woolworths enhancements
// @namespace  http://yihanzhao.com/
// @version    0.2
// @description Woolworths enhancements
// @match      www.woolworths.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/woolworths.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/woolworths.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var WW_URL = 'https://www.woolworths.com.au';

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
		$('.shelfProductStamp').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var productInfo = productElem.find('.shelfProductStamp-productNameInnerDescription');
        var name = productInfo.attr('title');
        var detailUrl = productInfo.attr('href');
        var photoUrl = productElem.find('img.shelfProductStamp-productImage').attr('src');
        var id = extractNumber(/productId=(\d+)/, detailUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.pricingContainer-priceAmount').text());
        var rrp = price;

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
