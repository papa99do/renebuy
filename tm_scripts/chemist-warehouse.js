// ==UserScript==
// @name       Chemist warehouse enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description  Chemist warehouse enhancements
// @match      https://www.chemistwarehouse.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require https://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var CM_URL = "https://www.chemistwarehouse.com.au";

$(document).ready(function() {

    function addEnhanceBtn(enhanceBtnHtml) {
        $('.Product').each(function() {
        	$(this).append(enhanceBtnHtml);
     	});
    }

    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent().find('a');
        if (!productElem.attr('href')) {
            productElem = $enhanceBtn.parent().parent().parent();
        }
        var detailUrl = productElem.attr('href');
        var name = productElem.attr('title').trim();
        var id = extractNumber(/\/(\d+)\//, detailUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.Price').text());
        var save =  extractNumber(/\$([0-9.]+)/, productElem.find('.Save').text());
        var photoUrl = productElem.find('img').attr('src');
        if (photoUrl.indexOf('?') > -1) {
        	photoUrl = photoUrl.substring(0, photoUrl.indexOf('?'));
        }

        var product = {
            store: 'CW',
            productId: id,
            name: name,
            price: price,
            rrp: Math.round((price + save) * 100) / 100,
            photos: [photoUrl],
            detailUrl: CM_URL + '/' + detailUrl
        };

        return product;
    }

    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();

});
