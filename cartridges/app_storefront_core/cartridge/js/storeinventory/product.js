'use strict';

var _ = require('lodash'),
    inventory = require('./');

var newLine = '\n';
var pdpStoreTemplate = function (store) {
    return [
        '<li class="store-list-item ' + (store.storeId === User.storeId ? ' selected' : '') + '">',
        '    <div class="store-address">' + store.address1 + ', ' + store.city + ' ' + store.stateCode +
        ' ' + store.postalCode + '</div>',
        '    <div class="store-status" data-status="' + store.statusclass + '">' + store.status + '</div>',
        '</li>'
    ].join(newLine);
};
var pdpStoresListingTemplate = function (stores) {
    if (stores && stores.length) {
        return [
            '<div class="store-list-pdp-container">',
            (stores.length > 1 ? '    <a class="stores-toggle collapsed" href="#">' + Resources.SEE_MORE + '</a>' : ''),
            '    <ul class="store-list-pdp">',
            _.map(stores, pdpStoreTemplate).join(newLine),
            '    </ul>',
            '</div>'
        ].join(newLine);
    }
};

var storesListing = function (stores) {
    // list all stores on PDP page
    if ($('.store-list-pdp-container').length) {
        $('.store-list-pdp-container').remove();
    }
    $('.availability-results').append(pdpStoresListingTemplate(stores));
};

var productInventory = {
    setPreferredStore: function (storeId) {
        User.storeId = storeId;
        $.ajax({
            url: Urls.setPreferredStore,
            type: 'POST',
            data: {storeId: storeId}
        });
    },
    productSelectStore: function () {
        var self = this;
        inventory.getStoresInventory(this.pid).then(function (stores) {
            inventory.selectStoreDialog({
                stores: stores,
                selectedStoreId: User.storeId,
                selectedStoreText: Resources.PREFERRED_STORE,
                continueCallback: storesListing,
                selectStoreCallback: self.setPreferredStore
            });
        }).done();
    },
    init: function () {
        var $availabilityContainer = $('.availability-results'),
            self = this;
        this.pid = $('input[name="pid"]').val();

        $('#product-content .set-preferred-store').on('click', function (e) {
            e.preventDefault();
            if (!User.zip) {
                inventory.zipPrompt(function () {
                    self.productSelectStore();
                });
            } else {
                self.productSelectStore();
            }
        });

        if ($availabilityContainer.length) {
            if (User.storeId) {
                inventory.getStoresInventory(this.pid).then(storesListing);
            }

            // See more or less stores in the listing
            $availabilityContainer.on('click', '.stores-toggle', function (e) {
                e.preventDefault();
                $('.store-list-pdp .store-list-item').toggleClass('visible');
                if ($(this).hasClass('collapsed')) {
                    $(this).text(Resources.SEE_LESS);
                } else {
                    $(this).text(Resources.SEE_MORE);
                }
                $(this).toggleClass('collapsed');
            });
        }
    }
};

module.exports = productInventory;
