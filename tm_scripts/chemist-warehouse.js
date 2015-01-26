// ==UserScript==
// @name       Chemist warehouse enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description  Chemist warehouse enhancements
// @match      http://www.chemistwarehouse.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://localhost:3001/js/monkey/renebuy-enhance.js?1
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";

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
        
        var CM_URL = "http://www.chemistwarehouse.com.au";
        
        var product = {
            store: 'CW',
            productId: id,
            name: productElem.find('.productName_row > a').attr('title').trim(),
            price: price,
            rrp: Math.round((price + save) * 100) / 100,
            photos: [CM_URL + photoUrl],
            detailUrl: CM_URL + '/' + detailUrl
        };	
        
        return product;
    }
    
    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();
   
});
