'use strict';

var addProductToCart = require('./product/addToCart'),
    ajax = require('../ajax'),
    page = require('../page'),
    productTile = require('../product-tile'),
    quickview = require('../quickview');

/**
 * @private
 * @function
 * @description Binds the click events to the remove-link and quick-view button
 */
function initializeEvents() {
    $('#compare-table').on('click', '.remove-link', function (e) {
        e.preventDefault();
        ajax.getJson({
            url: this.href,
            callback: function () {
                page.refresh();
            }
        });
    })
    .on('click', '.open-quick-view', function (e) {
        e.preventDefault();
        var url = $(this).closest('.product').find('.thumb-link').attr('href');
        quickview.show({
            url: url,
            source: 'quickview'
        });
    });

    $('#compare-category-list').on('change', function () {
        $(this).closest('form').submit();
    });
}

exports.init = function () {
    productTile.init();
    initializeEvents();
    addProductToCart();
};
