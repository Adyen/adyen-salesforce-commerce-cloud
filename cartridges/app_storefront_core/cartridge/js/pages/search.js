'use strict';

var compareWidget = require('../compare-widget'),
    productTile = require('../product-tile'),
    progress = require('../progress'),
    util = require('../util');

function infiniteScroll() {
    // getting the hidden div, which is the placeholder for the next page
    var loadingPlaceHolder = $('.infinite-scroll-placeholder[data-loading-state="unloaded"]');
    // get url hidden in DOM
    var gridUrl = loadingPlaceHolder.attr('data-grid-url');

    if (loadingPlaceHolder.length === 1 && util.elementInViewport(loadingPlaceHolder.get(0), 250)) {
        // switch state to 'loading'
        // - switches state, so the above selector is only matching once
        // - shows loading indicator
        loadingPlaceHolder.attr('data-loading-state', 'loading');
        loadingPlaceHolder.addClass('infinite-scroll-loading');


        // named wrapper function, which can either be called, if cache is hit, or ajax repsonse is received
        var fillEndlessScrollChunk = function (html) {
            loadingPlaceHolder.removeClass('infinite-scroll-loading');
            loadingPlaceHolder.attr('data-loading-state', 'loaded');
            $('div.search-result-content').append(html);
        };

        // old condition for caching was `'sessionStorage' in window && sessionStorage["scroll-cache_" + gridUrl]`
        // it was removed to temporarily address RAP-2649

        $.ajax({
            type: 'GET',
            dataType: 'html',
            url: gridUrl,
            success: function (response) {
                // put response into cache
                try {
                    sessionStorage['scroll-cache_' + gridUrl] = response;
                } catch (e) {
                    // nothing to catch in case of out of memory of session storage
                    // it will fall back to load via ajax
                }
                // update UI
                fillEndlessScrollChunk(response);
                productTile.init();
            }
        });
    }
}
/**
 * @private
 * @function
 * @description replaces breadcrumbs, lefthand nav and product listing with ajax and puts a loading indicator over the product listing
 */
function updateProductListing(url) {
    if (!url || url === window.location.href) {
        return;
    }
    progress.show($('.search-result-content'));
    $('#main').load(util.appendParamToURL(url, 'format', 'ajax'), function () {
        compareWidget.init();
        productTile.init();
        progress.hide();
        history.pushState(undefined, '', url);
    });
}

/**
 * @private
 * @function
 * @description Initializes events for the following elements:<br/>
 * <p>refinement blocks</p>
 * <p>updating grid: refinements, pagination, breadcrumb</p>
 * <p>item click</p>
 * <p>sorting changes</p>
 */
function initializeEvents() {
    var $main = $('#main');
    // compare checked
    $main.on('click', 'input[type="checkbox"].compare-check', function () {
        var cb = $(this);
        var tile = cb.closest('.product-tile');

        var func = this.checked ? compareWidget.addProduct : compareWidget.removeProduct;
        var itemImg = tile.find('.product-image a img').first();
        func({
            itemid: tile.data('itemid'),
            uuid: tile[0].id,
            img: itemImg,
            cb: cb
        });

    });

    // handle toggle refinement blocks
    $main.on('click', '.refinement h3', function () {
        $(this).toggleClass('expanded')
        .siblings('ul').toggle();
    });

    // handle events for updating grid
    $main.on('click', '.refinements a, .pagination a, .breadcrumb-refinement-value a', function (e) {
        // don't intercept for category and folder refinements, as well as unselectable
        if ($(this).parents('.category-refinement').length > 0 || $(this).parents('.folder-refinement').length > 0 || $(this).parent().hasClass('unselectable')) {
            return;
        }
        e.preventDefault();
        updateProductListing(this.href);
    });

    // handle events item click. append params.
    $main.on('click', '.product-tile a:not("#quickviewbutton")', function () {
        var a = $(this);
        // get current page refinement values
        var wl = window.location;

        var qsParams = (wl.search.length > 1) ? util.getQueryStringParams(wl.search.substr(1)) : {};
        var hashParams = (wl.hash.length > 1) ? util.getQueryStringParams(wl.hash.substr(1)) : {};

        // merge hash params with querystring params
        var params = $.extend(hashParams, qsParams);
        if (!params.start) {
            params.start = 0;
        }
        // get the index of the selected item and save as start parameter
        var tile = a.closest('.product-tile');
        var idx = tile.data('idx') ? + tile.data('idx') : 0;

        // convert params.start to integer and add index
        params.start = (+params.start) + (idx + 1);
        // set the hash and allow normal action to continue
        a[0].hash = $.param(params);
    });

    // handle sorting change
    $main.on('change', '.sort-by select', function (e) {
        e.preventDefault();
        updateProductListing($(this).find('option:selected').val());
    })
    .on('change', '.items-per-page select', function () {
        var refineUrl = $(this).find('option:selected').val();
        if (refineUrl === 'INFINITE_SCROLL') {
            $('html').addClass('infinite-scroll').removeClass('disable-infinite-scroll');
        } else {
            $('html').addClass('disable-infinite-scroll').removeClass('infinite-scroll');
            updateProductListing(refineUrl);
        }
    });
}

exports.init = function () {
    compareWidget.init();
    if (SitePreferences.LISTING_INFINITE_SCROLL) {
        $(window).on('scroll', infiniteScroll);
    }
    productTile.init();
    initializeEvents();
};
