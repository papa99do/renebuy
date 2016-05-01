// ==UserScript==
// @name       Polar express parcel enhancements
// @namespace  http://yihanzhao.com/
// @version    0.1
// @description Polar express parcel enhancements
// @match      http://polarexpress.com.au/member/torderedit/*
// @copyright  2015+, Yihan Zhao, yihanzhao@gmail.com
// @require http://code.jquery.com/jquery-latest.js
// @updateURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts/polar-express-parcel.js
// @downloadURL https://raw.githubusercontent.com/papa99do/renebuy/master/tm_scripts//polar-express-parcel.js
// @grant      GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    var reneBuyUrl = "http://renebuy.yihanzhao.com/api/parcel";
    //var reneBuyUrl = "http://localhost:3001/api/parcel";

    var tables = $('#member_table > tbody');
    var orderTime = cell(tables.eq(0), 0, 0).find('span.fl').text().replace('下单时间：', '');
    var recipientName = cell(tables.eq(0), 1, 2).text().trim();

    for (var i = 1; i < tables.length; i++) {
        cell(tables.eq(i), 0, 0).append($('<br><button class="sync_btn">同步到Renebuy</button>'));
        tables.eq(i).find('button.sync_btn').click(function () {
            var table = $(this).parent().parent().parent();
            var parcel = extractParcelInfo(table);
            syncParcelInfo(parcel);
        });
    }

    function syncParcelInfo(parcel) {
        console.log(parcel);
        GM_xmlhttpRequest({
            method: 'POST',
            url: reneBuyUrl,
            headers: {'Content-Type': 'application/json'},
            data: JSON.stringify(parcel),
            onload: function(data) {
                if (data.status === 200) {
                    showMessage('SUCCESS', 'Parcel saved!');
                } else if (data.status >= 400) {
                    showMessage('ERROR', data.response);
                }
            },
            onerror: function(err) {
                console.error(err);
                showMessage('ERROR', JSON.stringify(err));
            }
        });
    }

    function showMessage(type, message) {
        alert(type + ': ' + message);
    }

    function extractParcelInfo(table) {
        return {
            trackingNumber : cell(table, 0, 1).text().trim(),
            sentDate: new Date(orderTime),
            weight : cell(table, 0, 3).text().trim().replace(' KGs', ''),
            totalQuantity : cell(table, 0, 4).text().trim(),
            recipient: recipientName,
            destination : cell(table, 1, 1).text().trim(),
            itemDetails : getDetails(cell(table, 2, 1).text().replace(/\s+/g, ' ').trim()),
            status: 'new'
        };
    }

    function getDetails(detailsString) {
        // detailsString = "护肝片 hgp*2 月见草 yjc*1 关节灵 gjl*1 洗发水250ml以下 xfs*1 羊奶皂 ynz*4"
        var itemStrings = detailsString.replace(/(\*\d+) /g, '$1\n').split('\n');
        return itemStrings.map(function(itemString) {
            var itemDetail = itemString.replace(/(\*)(\d+)/, '\t$2').split('\t');
            return {name: itemDetail[0], quantity: Number(itemDetail[1])};
        });

    }

    function cell(table, row, col) {
        return table.children().eq(row).children().eq(col);
    }
})();
