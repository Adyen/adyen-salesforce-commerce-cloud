'use strict';

var ajax = require('../../ajax'),
    tooltip = require('../../tooltip'),
    util = require('../../util');

module.exports = function () {
    var $addToCart = $('#add-to-cart'),
        $addAllToCart = $('#add-all-to-cart'),
        $productSetList = $('#product-set-list');

    var updateAddToCartButtons = function () {
        if ($productSetList.find('.add-to-cart[disabled]').length > 0) {
            $addAllToCart.attr('disabled', 'disabled');
            // product set does not have an add-to-cart button, but product bundle does
            $addToCart.attr('disabled', 'disabled');
        } else {
            $addAllToCart.removeAttr('disabled');
            $addToCart.removeAttr('disabled');
        }
    };

    if ($productSetList.length > 0) {
        updateAddToCartButtons();
    }
    // click on swatch for product set
    $productSetList.on('click', '.product-set-item .swatchanchor', function (e) {
        e.preventDefault();
        if ($(this).parents('li').hasClass('unselectable')) { return; }
        var url = Urls.getSetItem + this.search;
        var $container = $(this).closest('.product-set-item');
        var qty = $container.find('form input[name="Quantity"]').first().val();

        ajax.load({
            url: util.appendParamToURL(url, 'Quantity', isNaN(qty) ? '1' : qty),
            target: $container,
            callback: function () {
                updateAddToCartButtons();
                tooltip.init();
            }
        });
    });
};
