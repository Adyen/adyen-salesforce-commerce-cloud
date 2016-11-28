'use strict';

var ajax =  require('../../ajax'),
    util = require('../../util');

var updateContainer = function (data) {
    var $availabilityMsg = $('#pdpMain .availability .availability-msg');
    var message; // this should be lexically scoped, when `let` is supported (ES6)
    if (!data) {
        $availabilityMsg.html(Resources.ITEM_STATUS_NOTAVAILABLE);
        return;
    }
    $availabilityMsg.empty();
    // Look through levels ... if msg is not empty, then create span el
    if (data.levels.IN_STOCK > 0) {
        if (data.levels.PREORDER === 0 && data.levels.BACKORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
            // Just in stock
            message = Resources.IN_STOCK;
        } else {
            // In stock with conditions ...
            message = data.inStockMsg;
        }
        $availabilityMsg.append('<p class="in-stock-msg">' + message + '</p>');
    }
    if (data.levels.PREORDER > 0) {
        if (data.levels.IN_STOCK === 0 && data.levels.BACKORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
            message = Resources.PREORDER;
        } else {
            message = data.preOrderMsg;
        }
        $availabilityMsg.append('<p class="preorder-msg">' + message + '</p>');
    }
    if (data.levels.BACKORDER > 0) {
        if (data.levels.IN_STOCK === 0 && data.levels.PREORDER === 0 && data.levels.NOT_AVAILABLE === 0) {
            message = Resources.BACKORDER;
        } else {
            message = data.backOrderMsg;
        }
        $availabilityMsg.append('<p class="backorder-msg">' + message + '</p>');
    }
    if (data.inStockDate !== '') {
        $availabilityMsg.append('<p class="in-stock-date-msg">' + String.format(Resources.IN_STOCK_DATE, data.inStockDate) + '</p>');
    }
    if (data.levels.NOT_AVAILABLE > 0) {
        if (data.levels.PREORDER === 0 && data.levels.BACKORDER === 0 && data.levels.IN_STOCK === 0) {
            message = Resources.NOT_AVAILABLE;
        } else {
            message = Resources.REMAIN_NOT_AVAILABLE;
        }
        $availabilityMsg.append('<p class="not-available-msg">' + message + '</p>');
    }
};

var getAvailability = function () {
    ajax.getJson({
        url: util.appendParamsToUrl(Urls.getAvailability, {
            pid: $('#pid').val(),
            Quantity: $(this).val()
        }),
        callback: updateContainer
    });
};

module.exports = function () {
    $('#pdpMain').on('change', '.pdpForm input[name="Quantity"]', getAvailability);
};
