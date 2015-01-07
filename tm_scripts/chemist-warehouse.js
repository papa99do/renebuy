// ==UserScript==
// @name       Chemist warehouse enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description  Chemist warehouse enhancements
// @match      http://www.chemistwarehouse.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @grant      GM_xmlhttpRequest
// ==/UserScript==

$(document).ready(function() {
    $('.column').each(function() {
        $(this).removeAttr('onclick').removeAttr('onmouseover').removeAttr('onmouseout');
        $(this).find('.content_section').append('<div class="enhance"><button class="addBtn">Add to ReneBuy</button></div>');
    });
    
    $('.addBtn').click(function() {
        
        function extractNumber(pattern, text) {
        	var result = text.match(pattern);
            if (result && result.length > 1) {
            	return Number(result[1]);
            } 
        }

        // extract product information
        var productElem = $(this).parent().parent();
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
            store: 'Chemist warehouse',
            productId: id,
            name: productElem.find('.productName_row > a').attr('title'),
            price: price,
            rrp: Math.round((price + save) * 100) / 100,
            photos: [CM_URL + photoUrl],
            detailUrl: CM_URL + '/' + detailUrl
        };
        
        console.log(product);
        
        // save to ReneBuy
        var url = "http://localhost:3001/api/products";
        
        GM_xmlhttpRequest({
        	method: 'POST',
    		url: url,
            headers: {'Content-Type': 'application/json'},
    		data: JSON.stringify(product),            
    		onload: function(data) {       
        		console.log('Product added: ', data);
                if (data.status === 200) {
                	window.alert('Product added!');
                } else if (data.status >= 400) {
                    window.alert('ERROR: ' + data.response);
                }
    		},
            onerror: function(err) {
            	console.error(err);
                window.alert('ERROR: ' + err);
            }
        });
    });
});
