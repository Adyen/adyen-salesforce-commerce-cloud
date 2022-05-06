'use strict';

var ajax = require('../../ajax'),
    image = require('./image'),
    progress = require('../../progress'),
    productStoreInventory = require('../../storeinventory/product'),
    tooltip = require('../../tooltip'),
    util = require('../../util');


/**
 * @description update product content with new variant from href, load new content to #product-content panel
 * @param {String} href - url of the new product variant
 **/
var updateContent = function (href) {
    var $pdpForm = $('.pdpForm');
    var qty = $pdpForm.find('input[name="Quantity"]').first().val();
    var params = {
        Quantity: isNaN(qty) ? '1' : qty,
        format: 'ajax',
        productlistid: $pdpForm.find('input[name="productlistid"]').first().val()
    };

    progress.show($('#pdpMain'));

    ajax.load({
        url: util.appendParamsToUrl(href, params),
        target: $('#product-content'),
        callback: function () {
            if (SitePreferences.STORE_PICKUP) {
                productStoreInventory.init();
            }
            image.replaceImages();
            tooltip.init();
        }
    });
};

module.exports = function () {
    var $pdpMain = $('#pdpMain');
    // hover on swatch - should update main image with swatch image
    $pdpMain.on('mouseenter mouseleave', '.swatchanchor', function () {
        var largeImg = $(this).data('lgimg'),
            $imgZoom = $pdpMain.find('.main-image'),
            $mainImage = $pdpMain.find('.primary-image');

        if (!largeImg) { return; }
        // store the old data from main image for mouseleave handler
        $(this).data('lgimg', {
            hires: $imgZoom.attr('href'),
            url: $mainImage.attr('src'),
            alt: $mainImage.attr('alt'),
            title: $mainImage.attr('title')
        });
        // set the main image
        image.setMainImage(largeImg);
    });

    // click on swatch - should replace product content with new variant
    $pdpMain.on('click', '.product-detail .swatchanchor', function (e) {
        e.preventDefault();
        if ($(this).parents('li').hasClass('unselectable')) { return; }
        updateContent(this.href);
    });

    // change drop down variation attribute - should replace product content with new variant
    $pdpMain.on('change', '.variation-select', function () {
        if ($(this).val().length === 0) { return; }
        updateContent($(this).val());
    });
};
