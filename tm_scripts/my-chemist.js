// ==UserScript==
// @name       My chemist enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description  My chemist enhancements
// @match      http://www.mychemist.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/my-chemist.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/my-chemist.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var MC_URL = "http://www.mychemist.com.au";

$(document).ready(function() {

	function addEnhanceBtn(enhanceBtnHtml) {
        $('.column').each(function() {
        	$(this).removeAttr('onclick').removeAttr('onmouseover').removeAttr('onmouseout');
        	$(this).find('.content_section').append(enhanceBtnHtml);
    	});
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var detailUrl = productElem.find('.productName_row > a').attr('href');
        var id = extractNumber(/id=(\d+)/, detailUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.our_price').text());
        var save =  extractNumber(/\$([0-9.]+)/, productElem.find('.rrp_span').text());
        var photoUrl = productElem.find('img').attr('src');
        if (photoUrl.indexOf('?') > -1) {
        	photoUrl = photoUrl.substring(0, photoUrl.indexOf('?'));
        }

        var product = {
            store: 'MC',
            productId: id,
            name: productElem.find('.productName_row > a').attr('title').trim(),
            price: price,
            rrp: Math.round((price + save) * 100) / 100,
            photos: [MC_URL + photoUrl],
            detailUrl: MC_URL + '/' + detailUrl
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
