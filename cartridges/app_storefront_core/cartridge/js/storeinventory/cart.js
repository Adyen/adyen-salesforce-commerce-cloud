'use strict';

var inventory = require('./');

var cartInventory = {
    setSelectedStore: function (storeId) {
        var $selectedStore = $('.store-tile.' + storeId),
            $lineItem = $('.cart-row[data-uuid="' + this.uuid + '"]'),
            storeAddress = $selectedStore.find('.store-address').html(),
            storeStatus = $selectedStore.find('.store-status').data('status'),
            storeStatusText = $selectedStore.find('.store-status').text();
        this.selectedStore = storeId;

        $lineItem.find('.instore-delivery .selected-store-address')
            .data('storeId', storeId)
            .attr('data-store-id', storeId)
            .html(storeAddress);
        $lineItem.find('.instore-delivery .selected-store-availability')
            .data('status', storeStatus)
            .attr('data-status', storeStatus)
            .text(storeStatusText);
        $lineItem.find('.instore-delivery .delivery-option').removeAttr('disabled').trigger('click');
    },
    cartSelectStore: function (selectedStore) {
        var self = this;
        inventory.getStoresInventory(this.uuid).then(function (stores) {
            inventory.selectStoreDialog({
                stores: stores,
                selectedStoreId: selectedStore,
                selectedStoreText: Resources.SELECTED_STORE,
                continueCallback: function () {},
                selectStoreCallback: self.setSelectedStore.bind(self)
            });
        }).done();
    },
    setDeliveryOption: function (value, storeId) {
        // set loading state
        $('.item-delivery-options')
            .addClass('loading')
            .children().hide();

        var data = {
            plid: this.uuid,
            storepickup: (value === 'store' ? true : false)
        };
        if (value === 'store') {
            data.storepickup = true;
            data.storeid = storeId;
        } else {
            data.storepickup = false;
        }
        $.ajax({
            url: Urls.setStorePickup,
            data: data,
            success: function () {
                // remove loading state
                $('.item-delivery-options')
                    .removeClass('loading')
                    .children().show();
            }
        });
    },
    init: function () {
        var self = this;
        $('.item-delivery-options .set-preferred-store').on('click', function (e) {
            e.preventDefault();
            self.uuid = $(this).data('uuid');
            var selectedStore = $(this).closest('.instore-delivery').find('.selected-store-address').data('storeId');
            if (!User.zip) {
                inventory.zipPrompt(function () {
                    self.cartSelectStore(selectedStore);
                });
            } else {
                self.cartSelectStore(selectedStore);
            }
        });
        $('.item-delivery-options .delivery-option').on('click', function () {
            // reset the uuid
            var selectedStore = $(this).closest('.instore-delivery').find('.selected-store-address').data('storeId');
            self.uuid = $(this).closest('.cart-row').data('uuid');
            self.setDeliveryOption($(this).val(), selectedStore);
        });
    }
};

module.exports = cartInventory;
