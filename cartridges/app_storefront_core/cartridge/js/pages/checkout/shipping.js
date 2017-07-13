'use strict';

var ajax = require('../../ajax'),
    formPrepare = require('./formPrepare'),
    progress = require('../../progress'),
    tooltip = require('../../tooltip'),
    util = require('../../util');

var shippingMethods;
/**
 * @function
 * @description Initializes gift message box, if shipment is gift
 */
function giftMessageBox() {
    // show gift message box, if shipment is gift
    $('.gift-message-text').toggleClass('hidden', $('input[name$="_shippingAddress_isGift"]:checked').val() !== 'true');
}

/**
 * @function
 * @description updates the order summary based on a possibly recalculated basket after a shipping promotion has been applied
 */
function updateSummary() {
    var $summary = $('#secondary.summary');
    // indicate progress
    progress.show($summary);

    // load the updated summary area
    $summary.load(Urls.summaryRefreshURL, function () {
        // hide edit shipping method link
        $summary.fadeIn('fast');
        $summary.find('.checkout-mini-cart .minishipment .header a').hide();
        $summary.find('.order-totals-table .order-shipping .label a').hide();
    });
}

/**
 * @function
 * @description Helper method which constructs a URL for an AJAX request using the
 * entered address information as URL request parameters.
 */
function getShippingMethodURL(url, extraParams) {
    var $form = $('.address');
    var params = {
        address1: $form.find('input[name$="_address1"]').val(),
        address2: $form.find('input[name$="_address2"]').val(),
        countryCode: $form.find('select[id$="_country"]').val(),
        stateCode: $form.find('select[id$="_state"]').val(),
        postalCode: $form.find('input[name$="_postal"]').val(),
        city: $form.find('input[name$="_city"]').val()
    };
    return util.appendParamsToUrl(url, $.extend(params, extraParams));
}

/**
 * @function
 * @description selects a shipping method for the default shipment and updates the summary section on the right hand side
 * @param
 */
function selectShippingMethod(shippingMethodID) {
    // nothing entered
    if (!shippingMethodID) {
        return;
    }
    // attempt to set shipping method
    var url = getShippingMethodURL(Urls.selectShippingMethodsList, {shippingMethodID: shippingMethodID});
    ajax.getJson({
        url: url,
        callback: function (data) {
            updateSummary();
            if (!data || !data.shippingMethodID) {
                window.alert('Couldn\'t select shipping method.');
                return false;
            }
            // display promotion in UI and update the summary section,
            // if some promotions were applied
            $('.shippingpromotions').empty();

            // TODO the for loop below isn't doing anything?
            // if (data.shippingPriceAdjustments && data.shippingPriceAdjustments.length > 0) {
            //     var len = data.shippingPriceAdjustments.length;
            //     for (var i=0; i < len; i++) {
            //         var spa = data.shippingPriceAdjustments[i];
            //     }
            // }
        }
    });
}

/**
 * @function
 * @description Make an AJAX request to the server to retrieve the list of applicable shipping methods
 * based on the merchandise in the cart and the currently entered shipping address
 * (the address may be only partially entered).  If the list of applicable shipping methods
 * has changed because new address information has been entered, then issue another AJAX
 * request which updates the currently selected shipping method (if needed) and also updates
 * the UI.
 */
function updateShippingMethodList() {
    var $shippingMethodList = $('#shipping-method-list');
    if (!$shippingMethodList || $shippingMethodList.length === 0) { return; }
    var url = getShippingMethodURL(Urls.shippingMethodsJSON);

    ajax.getJson({
        url: url,
        callback: function (data) {
            if (!data) {
                window.alert('Couldn\'t get list of applicable shipping methods.');
                return false;
            }
            if (shippingMethods && shippingMethods.toString() === data.toString()) {
                // No need to update the UI.  The list has not changed.
                return true;
            }

            // We need to update the UI.  The list has changed.
            // Cache the array of returned shipping methods.
            shippingMethods = data;
            // indicate progress
            progress.show($shippingMethodList);

            // load the shipping method form
            var smlUrl = getShippingMethodURL(Urls.shippingMethodsList);
            $shippingMethodList.load(smlUrl, function () {
                $shippingMethodList.fadeIn('fast');
                // rebind the radio buttons onclick function to a handler.
                $shippingMethodList.find('[name$="_shippingMethodID"]').click(function () {
                    selectShippingMethod($(this).val());
                });

                // update the summary
                updateSummary();
                progress.hide();
                tooltip.init();
                //if nothing is selected in the shipping methods select the first one
                if ($shippingMethodList.find('.input-radio:checked').length === 0) {
                    $shippingMethodList.find('.input-radio:first').prop('checked', 'checked');
                }
            });
        }
    });
}

exports.init = function () {
    formPrepare.init({
        continueSelector: '[name$="shippingAddress_save"]',
        formSelector:'[id$="singleshipping_shippingAddress"]'
    });
    $('input[name$="_shippingAddress_isGift"]').on('click', giftMessageBox);

    $('.address').on('change',
        'input[name$="_addressFields_address1"], input[name$="_addressFields_address2"], select[name$="_addressFields_states_state"], input[name$="_addressFields_city"], input[name$="_addressFields_zip"]',
        updateShippingMethodList
    );

    giftMessageBox();
    updateShippingMethodList();
};

exports.updateShippingMethodList = updateShippingMethodList;
