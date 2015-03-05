// ==UserScript==
// @name       Jack n Jill enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Jack n Jill enhancements
// @match      http://www.jackandjillkids.com/au*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @require http://renebuy.yihanzhao.com/js/monkey/renebuy-enhance.js?1
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
        var name = productElem.find('.product-name > a').text();
        var detailUrl = productElem.find('.product-name > a').attr('href');
        var photoUrl = productElem.find('img').attr('src');
        var id = extractNumber(/product\/(\d+)\/form/, productElem.find('.actions > button').attr('onclick'));
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price').text());
        var rrp = price;
        
        var product = {
            productId: id,
            name: name.replace(/\s+/g, ' ').trim(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl,
			store: 'JJ'
        };
       
        return product;
    }
    
    renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl).init();
    
});