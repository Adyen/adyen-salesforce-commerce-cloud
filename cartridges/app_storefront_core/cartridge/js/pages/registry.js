'use strict';

var addProductToCart = require('./product/addToCart'),
    ajax = require('../ajax'),
    login = require('../login'),
    quickview = require('../quickview'),
    util = require('../util');

/**
 * @function
 * @description Loads address details to a given address and fills the address form
 * @param {String} addressID The ID of the address to which data will be loaded
 */
function populateForm(addressID, $form) {
    // load address details
    var url = Urls.giftRegAdd + addressID;
    ajax.getJson({
        url: url,
        callback: function (data) {
            if (!data || !data.address) {
                window.alert(Resources.REG_ADDR_ERROR);
                return false;
            }
            // fill the form
            $form.find('[name$="_addressid"]').val(data.address.ID);
            $form.find('[name$="_firstname"]').val(data.address.firstName);
            $form.find('[name$="_lastname"]').val(data.address.lastName);
            $form.find('[name$="_address1"]').val(data.address.address1);
            $form.find('[name$="_address2"]').val(data.address.address2);
            $form.find('[name$="_city"]').val(data.address.city);
            $form.find('[name$="_country"]').val(data.address.countryCode).trigger('change');
            $form.find('[name$="_postal"]').val(data.address.postalCode);
            $form.find('[name$="_state"]').val(data.address.stateCode);
            $form.find('[name$="_phone"]').val(data.address.phone);
            // $form.parent('form').validate().form();
        }
    });
}

/**
 * @private
 * @function
 * @description Initializes events for the gift registration
 */
function initializeEvents() {
    var $eventAddressForm = $('form[name$="_giftregistry"]'),
        $beforeAddress = $eventAddressForm.find('fieldset[name="address-before"]'),
        $afterAddress = $eventAddressForm.find('fieldset[name="address-after"]');

    $('.usepreevent').on('click', function () {
        // filter out storefront toolkit
        $(':input', $beforeAddress).not('[id^="ext"]').not('select[name$="_addressBeforeList"]').each(function () {
            var fieldName = $(this).attr('name'),
                $afterField = $afterAddress.find('[name="' + fieldName.replace('Before', 'After') + '"]');
            $afterField.val($(this).val()).trigger('change');
        });
    });
    $eventAddressForm.on('change', 'select[name$="_addressBeforeList"]', function () {
        var addressID = $(this).val();
        if (addressID.length === 0) { return; }
        populateForm(addressID, $beforeAddress);
    })
    .on('change', 'select[name$="_addressAfterList"]', function () {
        var addressID = $(this).val();
        if (addressID.length === 0) { return; }
        populateForm(addressID, $afterAddress);
    });

    $('.item-list').on('click', '.item-edit-details a', function (e) {
        e.preventDefault();
        var productListID = $('input[name=productListID]').val();
        quickview.show({
            url: e.target.href,
            source: 'giftregistry',
            productlistid: productListID
        });
    });
}

exports.init = function () {
    initializeEvents();
    addProductToCart();
    login.init();
    util.setDeleteConfirmation('.item-list', String.format(Resources.CONFIRM_DELETE, Resources.TITLE_GIFTREGISTRY));
};
