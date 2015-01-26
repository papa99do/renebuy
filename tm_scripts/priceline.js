// ==UserScript==
// @name       Priceline enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Priceline enhancements
// @match      https://www.priceline.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

var reneBuyUrl = "http://renebuy.yihanzhao.com/api/product";
//var reneBuyUrl = "http://localhost:3001/api/product";

var PL_URL = "https://www.priceline.com.au";

$(document).ready(function() {
	
	function addEnhanceBtn(enhanceBtnHtml) {
		$('.product-box').each(function() {
	        $(this).append(enhanceBtnHtml);
	    });
    }
    
    function extractProductInfo($enhanceBtn, extractNumber) {
    	// extract product information
        var productElem = $enhanceBtn.parent().parent();
        var name = productElem.find('.product-img').attr('title').substring('Click for more info: '.length);
        var detailUrl = productElem.find('.product-img > a').attr('href');
        var photoUrl = productElem.find('.product-img img').attr('src');
        var id = extractNumber(/(\d+)_thumb\.jpg/, photoUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.product-price2').text());
        var rrpText = productElem.find('.product-price1').text();
        var rrp = rrpText ? extractNumber(/Was \$([0-9.]+)/, rrpText) : price;
        
        var product = {
            productId: id,
            name: name.trim(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: PL_URL + detailUrl,
			store: 'PL'
        };
       
        return product;
    }
    
    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();
    
});
