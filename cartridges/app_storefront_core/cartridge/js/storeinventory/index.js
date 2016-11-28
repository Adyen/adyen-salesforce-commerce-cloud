'use strict';

var _ = require('lodash'),
    dialog = require('../dialog'),
    TPromise = require('promise'),
    util = require('../util');

var newLine = '\n';
var storeTemplate = function (store, selectedStoreId, selectedStoreText) {
    return [
        '<li class="store-tile ' + store.storeId + (store.storeId === selectedStoreId ? ' selected' : '') + '">',
        '    <p class="store-address">',
        '        ' + store.address1 + '<br/>',
        '        ' + store.city + ', ' + store.stateCode + ' ' + store.postalCode,
        '    </p>',
        '    <p class="store-status" data-status="' + store.statusclass + '">' + store.status + '</p>',
        '    <button class="select-store-button" data-store-id="' + store.storeId + '"' +
        (store.statusclass !== 'store-in-stock' ? 'disabled="disabled"' : '') + '>',
        '        ' + (store.storeId === selectedStoreId ? selectedStoreText : Resources.SELECT_STORE),
        '    </button>',
        '</li>'
    ].join(newLine);
};

var storeListTemplate = function (stores, selectedStoreId, selectedStoreText) {
    if (stores && stores.length) {
        return [
            '<div class="store-list-container">',
            '<ul class="store-list">',
            _.map(stores, function (store) {
                return storeTemplate(store, selectedStoreId, selectedStoreText);
            }).join(newLine),
            '</ul>',
            '</div>',
            '<div class="store-list-pagination">',
            '</div>'
        ].join(newLine);
    } else {
        return '<div class="no-results">' + Resources.INVALID_ZIP + '</div>';
    }
};

var zipPromptTemplate = function () {
    return [
        '<div id="preferred-store-panel">',
        '    <input type="text" id="user-zip" placeholder="' + Resources.ENTER_ZIP + '" name="zipCode"/>',
        '</div>'
    ].join(newLine);
};

/**
 * @description test whether zipcode is valid for either US or Canada
 * @return {Boolean} true if the zipcode is valid for either country, false if it's invalid for both
 **/
var validateZipCode = function (zipCode) {
    var regexes = {
            canada: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
            usa: /^\d{5}(-\d{4})?$/
        },
        valid = false;
    if (!zipCode) { return; }
    _.each(regexes, function (re) {
        var regexp = new RegExp(re);
        valid = regexp.test(zipCode);
    });
    return valid;
};

var storeinventory = {
    zipPrompt: function (callback) {
        var self = this;
        dialog.open({
            html: zipPromptTemplate(),
            options: {
                title: Resources.STORE_NEAR_YOU,
                width: 500,
                buttons: [{
                    text: Resources.SEARCH,
                    click: function () {
                        var zipCode = $('#user-zip').val();
                        if (validateZipCode(zipCode)) {
                            self.setUserZip(zipCode);
                            if (callback) {
                                callback(zipCode);
                            }
                        }
                    }
                }],
                open: function () {
                    $('#user-zip').on('keypress', function (e) {
                        if (e.which === 13) {
                            // trigger the search button
                            $('.ui-dialog-buttonset .ui-button').trigger('click');
                        }
                    });
                }
            }
        });
    },
    getStoresInventory: function (pid) {
        return TPromise.resolve($.ajax({
            url: util.appendParamsToUrl(Urls.storesInventory, {
                pid: pid,
                zipCode: User.zip
            }),
            dataType: 'json'
        }));
    },
    /**
     * @description open the dialog to select store
     * @param {Array} options.stores
     * @param {String} options.selectedStoreId
     * @param {String} options.selectedStoreText
     * @param {Function} options.continueCallback
     * @param {Function} options.selectStoreCallback
     **/
    selectStoreDialog: function (options) {
        var self = this,
            stores = options.stores,
            selectedStoreId = options.selectedStoreId,
            selectedStoreText = options.selectedStoreText,
            storeList = storeListTemplate(stores, selectedStoreId, selectedStoreText);
        dialog.open({
            html: storeList,
            options: {
                title: Resources.SELECT_STORE + ' - ' + User.zip,
                buttons: [{
                    text: Resources.CHANGE_LOCATION,
                    click: function () {
                        self.setUserZip(null);
                        // trigger the event to start the process all over again
                        $('.set-preferred-store').trigger('click');
                    }.bind(this)
                }, {
                    text: Resources.CONTINUE,
                    click: function () {
                        if (options.continueCallback) {
                            options.continueCallback(stores);
                        }
                        dialog.close();
                    }
                }],
                open: function () {
                    $('.select-store-button').on('click', function (e) {
                        e.preventDefault();
                        var storeId = $(this).data('storeId');
                        // if the store is already selected, don't select again
                        if (storeId === selectedStoreId) { return; }
                        $('.store-list .store-tile.selected').removeClass('selected')
                            .find('.select-store-button').text(Resources.SELECT_STORE);
                        $(this).text(selectedStoreText)
                            .closest('.store-tile').addClass('selected');
                        if (options.selectStoreCallback) {
                            options.selectStoreCallback(storeId);
                        }
                    });
                }
            }
        });
    },
    setUserZip: function (zip) {
        User.zip = zip;
        $.ajax({
            type: 'POST',
            url: Urls.setZipCode,
            data: {
                zipCode: zip
            }
        });
    },
    shippingLoad: function () {
        var $checkoutForm = $('.address');
        $checkoutForm.off('click');
        $checkoutForm.on('click', 'input[name$="_shippingAddress_isGift"]', function () {
            $(this).parent().siblings('.gift-message-text').toggleClass('hidden', $('input[name$="_shippingAddress_isGift"]:checked').val());
        });
    }
};

module.exports = storeinventory;
