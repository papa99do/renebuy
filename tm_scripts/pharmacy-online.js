// ==UserScript==
// @name       Pharmacy online enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Pharmacy online enhancements
// @match      http://*.pharmacyonline.com.au/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @grant      GM_xmlhttpRequest
// ==/UserScript==

$(document).ready(function() {
    $('.item').each(function() {
        $(this).append('<div class="enhance"><button class="addBtn">Add to ReneBuy</button></div>');
    });
    
    $('.addBtn').click(function() {
        
        function extractNumber(pattern, text) {
            if (!text) return;
        	var result = text.match(pattern);
            if (result && result.length > 1) {
            	return Number(result[1]);
            } 
        }

        // extract product information
        var productElem = $(this).parent().parent();
        var detailUrl = productElem.find('.prod_link').attr('href');
        var photoUrl = productElem.find('.product-image').attr('src');
        var id = extractNumber(/(\d+)(_\d+)?\.jpg/, photoUrl);
        var price = extractNumber(/\$([0-9.]+)/, productElem.find('.price').text());
        var rrp =  extractNumber(/\$([0-9.]+)/, productElem.find('.rrp-linethrough').text());
        
        var product = {
            store: 'Pharmacy online',
            productId: id,
            name: productElem.find('.name').text(),
            price: price,
            rrp: rrp,
            photos: [photoUrl],
            detailUrl: detailUrl
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
