function renebuy($, GM_xmlhttpRequest, GM_addStyle, addEnhanceBtn, extractProductInfo, reneBuyUrl, test) {
	var enhanceBtnHtml = '<div class="enhance"><button class="addBtn">Add to ReneBuy</button></div>';
	
	var init = function() {
		addEnhanceBtn(enhanceBtnHtml);
		addEnhanceBtnEvent(extractProductInfo);
		appendPopUp();
		addConfirmBtnEvent();
		appendStyle();
	};
	
	function addEnhanceBtnEvent(extractProductInfo) {
		$('.addBtn').click(function() {
			var product = extractProductInfo($(this), extractNumber);
			console.log(product);
			if (!test) {
				getSimilarProducts(product);
			}
		});	
	}
	
	function extractNumber(pattern, text) {
	    var result = text.match(pattern);
	    if (result && result.length > 1) {
	    	return Number(result[1]);
	    } 
	}
	
	function getSimilarProducts(product) {
        GM_xmlhttpRequest({
            method: 'Get',
            url: reneBuyUrl + '?sm=true&q=' + product.name,
            headers: {'Content-Type': 'application/json'},
            onload: function(data) {
                var similarProducts = [];
                if (data.status === 200) {
                    similarProducts = JSON.parse(data.response);
                }
                //console.log(similarProducts);
                showPopup(product, similarProducts);
            }
        });	
    }

	function showPopup(product, similarProducts) {
	    $('#reneBuyId').val('');
	    $('#productWeight').val('');
	    $('#productHighTax').removeAttr('checked');
		$('#nameInChinese').val('');
	    $('.message').html('');
	    $('#productName').val(product.name);
    
	    if (similarProducts.length > 0) {
	    	$('#productCategory').val(similarProducts[0].category.join(' > '));
	        if (similarProducts[0].name === product.name) {
				$('#nameInChinese').val(similarProducts[0].nameInChinese);
	        	$('#productWeight').val(similarProducts[0].weight);
	            if (similarProducts[0].isHighTax) {$('#productHighTax').prop('checked', true)}
	        }
	    } else {
	    	$('#productCategory').val('');	
	    }
    
	    $('#productCache').val(JSON.stringify(product));
    
	    $('#similarProducts').html('');
	    for (var i = 0; i < similarProducts.length; i++) {
	        var id = similarProducts[i]._id;
	        var name = similarProducts[i].name;
	        var category = similarProducts[i].category.join(' > ');
	        $('#similarProducts').append('<li>' + name + ', Use this <a href="#" title="' + name + '" id="' + id + '">product</a> or <a href="#" title="' + category + '" id="c_' + id + '">category</a></li>');
    
	        $('#' + id).click(function() {  
	        	$('#reneBuyId').val($(this).attr('id'));
	            $('#productName').val($(this).attr('title'));
	            return false;
	        });
    
	        $('#c_' + id).click(function() { 
	            console.log('assign category :', $(this).attr('title'));
	            $('#productCategory').val($(this).attr('title'));
	            return false;
	        });
    
	    }
    
		$("#gmPopupContainer").show();	
	}
	
	function appendPopUp() {
		$('body').append('\
		    <div id="gmPopupContainer">\
			Similar produts: <ul id="similarProducts"></ul>					          \
		    <form>  																  \
				<input type="hidden" id="reneBuyId" value="">                           	\
				<input type="hidden" id="productCache" value="">                           	\
				<div><label for="productName">Name:</label><input type="text" id="productName" value="" size="50"></div> \
				<span style="font-size:small; color:grey;">The following fields are valid and required only when creating new product:</span> \
		        <div><label for="nameInChinese">中文名称:</label><input type="text" id="nameInChinese" value="" size="50"></div>\
		        <div><label for="productCategory">Category:</label><input type="text" id="productCategory" value="" size="50"></div>\
				<div>\
		        	<label for="productWeight">Weight:</label><input type="text" id="productWeight" value="" size="5">g \
					<label style="width: 6em;"><input type="checkbox" id="productHighTax"> High tax</label>\
		        </div>\
				<div style="width: 100%; text-align: center;">\
		        	<button id="gmConfirmBtn" type="button">Add to Renebuy</button>  	  \
		        	<button id="gmCloseDlgBtn" type="button">Close</button>         	  \
				</div>\
		    </form>                                                                   \
			<img src="http://renebuy.yihanzhao.com/images/spin-progress.gif" id="spinProgress" style="display:none; width: 30px; height: 30px;"> \
			<div id="errorMessage" class="message"></div> \
			<div id="successMessage" class="message"></div> \
		    </div>                                                                    \
		');
	}
	
	function addConfirmBtnEvent() {
		$("#gmConfirmBtn").click (function () {
		    $(this).attr('disabled', 'disabled');
		    var product = JSON.parse($('#productCache').val());
		    var id = $('#reneBuyId').val();
		    if (id) {product.id = id};
		    product.name = $('#productName').val();
			product.nameInChinese = $('#nameInChinese').val();
		    product.category = $('#productCategory').val();
		    product.weight = parseInt($('#productWeight').val());
		    product.isHighTax = $('#productHighTax').is(":checked");
        
		    console.log('aaaaaaa', product);
        
		    $('#spinProgress').show();
        
		    GM_xmlhttpRequest({
		        method: 'POST',
		        url: reneBuyUrl,
		        headers: {'Content-Type': 'application/json'},
		        data: JSON.stringify(product),            
		        onload: function(data) {       
		            console.log('Product added: ', data);
		            if (data.status === 200) {
		                $('#successMessage').html('Product added!');
		                $('#errorMessage').html('');
		                $("#gmConfirmBtn").removeAttr('disabled');
		                $('#spinProgress').hide();
		            } else if (data.status >= 400) {
		                $('#successMessage').html('');
		                $('#errorMessage').html('ERROR: ' + data.response);
		                $("#gmConfirmBtn").removeAttr('disabled');
		                $('#spinProgress').hide();
		            }
		                },
		        onerror: function(err) {
		            console.error(err);
		            $('#successMessage').html('');
		            $('#errorMessage').html('ERROR: ' + err);
		            $("#gmConfirmBtn").removeAttr('disabled');
		            $('#spinProgress').hide();
		        }
		    });
        
		});
        
		$("#gmCloseDlgBtn").click ( function () {
		    $("#gmPopupContainer").hide ();
		});
	}
	
	function appendStyle() {
		//--- CSS styles make it work...
		GM_addStyle ( '                                                \
		    #gmPopupContainer {                                         \
				font-size: 				large; \
		        position:               fixed;                          \
				display:                none;                           \
		        top:                    10%;                            \
		        left:                   20%;                            \
		        padding:                2em;                            \
		        background:             powderblue;                     \
		        border:                 3px double black;               \
		        border-radius:          1ex;                            \
		        z-index:                777;                            \
				text-align: left; \
		    }                                                           \
		    #gmPopupContainer button{                                   \
		        cursor: hand; \
		        color: white;\
		        border-radius: 4px; \
		        background: rgb(66, 184, 221);\
		        font-size: large; \
		        margin: 0.5em 2em; \
		    }                                                           \
			#gmPopupContainer label{                                   \
		        width:                 4.5em;                        \
				display:				inline-block;				\
				text-align: end; \
		        padding-right:                 1em ;                      \
		    }                                                           \
		    #gmPopupContainer div { padding-bottom: 0.2em 0;  } \
		    #gmPopupContainer input[type="text"] { font-size: large; } \
		    #gmPopupContainer div.message { font-size: large } \
		    #errorMessage {color: red } \
		    #successMessage {color: green } \
		' );
	}
	
	return {
		init: init
	};
}