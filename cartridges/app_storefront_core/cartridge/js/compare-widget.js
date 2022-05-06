'use strict';

var page = require('./page'),
    util = require('./util'),
    TPromise = require('promise');

var _currentCategory = '',
    MAX_ACTIVE = 6;

/**
 * @private
 * @function
 * @description Verifies the number of elements in the compare container and updates it with sequential classes for ui targeting
 */
function refreshContainer() {
    var $compareContainer = $('.compare-items');
    var $compareItems = $compareContainer.find('.compare-item');
    var numActive = $compareItems.filter('.active').length;

    if (numActive < 2) {
        $('#compare-items-button').attr('disabled', 'disabled');
    } else {
        $('#compare-items-button').removeAttr('disabled');
    }

    $compareContainer.toggle(numActive > 0);
}
/**
 * @private
 * @function
 * @description Adds an item to the compare container and refreshes it
 */
function addToList(data) {
    // get the first compare-item not currently active
    var $item = $('.compare-items .compare-item').not('.active').first(),
        $productTile = $('#' + data.uuid);

    if ($item.length === 0) {
        if ($productTile.length > 0) {
            $productTile.find('.compare-check')[0].checked = false;
        }
        window.alert(Resources.COMPARE_ADD_FAIL);
        return;
    }

    // if already added somehow, return
    if ($('[data-uuid="' + data.uuid + '"]').length > 0) {
        return;
    }
    // set as active item
    $item.addClass('active')
        .attr('data-uuid', data.uuid)
        .attr('data-itemid', data.itemid)
        .data('uuid', data.uuid)
        .data('itemid', data.itemid)
        .append($(data.img).clone().addClass('compare-item-image'));
}
/**
 * @private
 * @function
 * description Removes an item from the compare container and refreshes it
 */
function removeFromList($item) {
    if ($item.length === 0) { return; }
    // remove class, data and id from item
    $item.removeClass('active')
        .removeAttr('data-uuid')
        .removeAttr('data-itemid')
        .data('uuid', '')
        .data('itemid', '')
        // remove the image
        .find('.compare-item-image').remove();
}

function addProductAjax(args) {
    var promise = new TPromise(function (resolve, reject) {
        $.ajax({
            url: Urls.compareAdd,
            data: {
                pid: args.itemid,
                category: _currentCategory
            },
            dataType: 'json'
        }).done(function (response) {
            if (!response || !response.success) {
                reject(new Error(Resources.COMPARE_ADD_FAIL));
            } else {
                resolve(response);
            }
        }).fail(function (jqxhr, status, err) {
            reject(new Error(err));
        });
    });
    return promise;
}

function removeProductAjax(args) {
    var promise = new TPromise(function (resolve, reject) {
        $.ajax({
            url: Urls.compareRemove,
            data: {
                pid: args.itemid,
                category: _currentCategory
            },
            dataType: 'json'
        }).done(function (response) {
            if (!response || !response.success) {
                reject(new Error(Resources.COMPARE_REMOVE_FAIL));
            } else {
                resolve(response);
            }
        }).fail(function (jqxhr, status, err) {
            reject(new Error(err));
        });
    });
    return promise;
}

function shiftImages() {
    return new TPromise(function (resolve) {
        var $items = $('.compare-items .compare-item');
        $items.each(function (i, item) {
            var $item = $(item);
            // last item
            if (i === $items.length - 1) {
                return removeFromList($item);
            }
            var $next = $items.eq(i + 1);
            if ($next.hasClass('active')) {
                // remove its own image
                $next.find('.compare-item-image').detach().appendTo($item);
                $item.addClass('active')
                    .attr('data-uuid', $next.data('uuid'))
                    .attr('data-itemid', $next.data('itemid'))
                    .data('uuid', $next.data('uuid'))
                    .data('itemid', $next.data('itemid'));
            }
        });
        resolve();
    });
}

/**
 * @function
 * @description Adds product to the compare table
 */
function addProduct(args) {
    var promise;
    var $items = $('.compare-items .compare-item');
    var $cb = $(args.cb);
    var numActive = $items.filter('.active').length;
    if (numActive === MAX_ACTIVE) {
        if (!window.confirm(Resources.COMPARE_CONFIRMATION)) {
            $cb[0].checked = false;
            return;
        }

        // remove product using id
        var $firstItem = $items.first();
        promise = removeItem($firstItem).then(function () {
            return shiftImages();
        });
    } else {
        promise = TPromise.resolve(0);
    }
    return promise.then(function () {
        return addProductAjax(args).then(function () {
            addToList(args);
            if ($cb && $cb.length > 0) { $cb[0].checked = true; }
            refreshContainer();
        });
    }).then(null, function () {
        if ($cb && $cb.length > 0) { $cb[0].checked = false; }
    });
}

/**
 * @function
 * @description Removes product from the compare table
 * @param {object} args - the arguments object should have the following properties: itemid, uuid and cb (checkbox)
 */
function removeProduct(args) {
    var $cb = args.cb ? $(args.cb) : null;
    return removeProductAjax(args).then(function () {
        var $item = $('[data-uuid="' + args.uuid + '"]');
        removeFromList($item);
        if ($cb && $cb.length > 0) { $cb[0].checked = false; }
        refreshContainer();
    }, function () {
        if ($cb && $cb.length > 0) { $cb[0].checked = true; }
    });
}

function removeItem($item) {
    var uuid = $item.data('uuid'),
        $productTile = $('#' + uuid);
    return removeProduct({
        itemid: $item.data('itemid'),
        uuid: uuid,
        cb: ($productTile.length === 0) ? null : $productTile.find('.compare-check')
    });
}

/**
 * @private
 * @function
 * @description Initializes the DOM-Object of the compare container
 */
function initializeDom() {
    var $compareContainer = $('.compare-items');
    _currentCategory = $compareContainer.data('category') || '';
    var $active = $compareContainer.find('.compare-item').filter('.active');
    $active.each(function () {
        var $productTile = $('#' +  $(this).data('uuid'));
        if ($productTile.length === 0) {return;}
        $productTile.find('.compare-check')[0].checked = true;
    });
    // set container state
    refreshContainer();
}

/**
 * @private
 * @function
 * @description Initializes the events on the compare container
 */
function initializeEvents() {
    // add event to buttons to remove products
    $('.compare-item').on('click', '.compare-item-remove', function () {
        removeItem($(this).closest('.compare-item'));
    });

    // Button to go to compare page
    $('#compare-items-button').on('click', function () {
        page.redirect(util.appendParamToURL(Urls.compareShow, 'category', _currentCategory));
    });

    // Button to clear all compared items
    // rely on refreshContainer to take care of hiding the container
    $('#clear-compared-items').on('click', function () {
        $('.compare-items .active').each(function () {
            removeItem($(this));
        });
    });
}

exports.init = function () {
    initializeDom();
    initializeEvents();
};

exports.addProduct = addProduct;
exports.removeProduct = removeProduct;
