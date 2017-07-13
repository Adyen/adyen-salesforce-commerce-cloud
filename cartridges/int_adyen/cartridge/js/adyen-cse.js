'use strict';

/**
 * @function
 * @description Initializes Adyen CSE Billing events
 */
function initializeBillingEvents() {
    $('#billing-submit').on('click', function (e) {
        var radioVal = $('.payment-method-options').find(':checked').val();
        if ('CREDIT_CARD' == radioVal) {
            e.preventDefault();
            var $creditCard = $('[data-method="CREDIT_CARD"]');
            var $encryptedData = $('#dwfrm_billing_paymentMethods_creditCard_encrypteddata');
            var $ccNum = $creditCard.find('input[name*="_creditCard_number"]');
            var $selectedCardID = $creditCard.find('input[name$="_selectedCardID"]');

            // the public key
            var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;

            var options = {};
            var cseInstance = adyen.encrypt.createEncryption(key, options);
            var postData = {};

            var cardData = {
                number: $ccNum.val(),
                cvc: $creditCard.find('input[name*="_cvn"]').val(),
                holderName: $creditCard.find('input[name$="creditCard_owner"]').val(),
                expiryMonth: $creditCard.find('[name$="_month"]').val(),
                expiryYear: $creditCard.find('[name$="_year"]').val(),
                generationtime: $('#cse_generationtime').val()
            };

            if ((cardData.number.indexOf('*') > -1 || cardData.cvc.indexOf('*') > -1) && $encryptedData != null && $encryptedData.val() !== '') {
                postData['adyen-encrypted-data'] = $encryptedData.val();
            } else if ((cardData.number.indexOf('*') > -1 || cardData.cvc.indexOf('*') > -1) && $selectedCardID != null && $selectedCardID.val() !== '') {
                postData['adyen-encrypted-data'] = '';
            } else {
                postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
            }

            if (postData['adyen-encrypted-data'] === false) {
                $('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
            } else {
                $('.form-data-error').html('');
                $encryptedData.val(postData['adyen-encrypted-data']);

                // replace CCNum with masked data
                $ccNum.val(maskValue($ccNum.val()));

                $('#billing-submit-hidden').trigger('click');
            }
        }
    });
}

/**
 * @function
 * @description Initializes Adyen CSE My Account events
 */
function initializeAccountEvents() {
    $('#add-card-submit').on('click', function (e) {
        e.preventDefault();
        var $creditCard = $('#CreditCardForm');
        var $encryptedData = $creditCard.find('input[name*="_encrypteddata"]');
        var $ccNum = $creditCard.find('input[name*="_number"]');
        // the public key
        var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;

        var options = {};
        var cseInstance = adyen.encrypt.createEncryption(key, options);
        var postData = {};

        var cardData = {
            number: $ccNum.val(),
            cvc: $creditCard.find('input[name*="_cvn"]').val(),
            holderName: $creditCard.find('input[name$="_owner"]').val(),
            expiryMonth: $creditCard.find('[name$="_month"]').val(),
            expiryYear: $creditCard.find('[name$="_year"]').val(),
            generationtime: $('#cse_generationtime').val()
        };

        if ((cardData.number.indexOf('*') > -1 || cardData.cvc.indexOf('*') > -1) && $encryptedData != null && $encryptedData.val() !== '') {
            postData['adyen-encrypted-data'] = $encryptedData.val();
        } else {
            postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
        }

        if (postData['adyen-encrypted-data'] === false) {
            $('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
        } else {
            $('.form-data-error').html('');
            $encryptedData.val(postData['adyen-encrypted-data']);

            // replace CCNum with masked data
            $ccNum.val(maskValue($ccNum.val()));

            $('#add-card-submit-hidden').trigger('click');
        }
    });
}

function maskValue(value) {
    if (value && value.length > 4) {
        return value.replace(/\d(?=\d{4})/g, '*');
    } else {
        return '';
    }
}

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */
exports.initBilling = function () {
    initializeBillingEvents();
};

/**
 * @function
 * @description Initializes Adyen CSE my account events
 */
exports.initAccount = function () {
    initializeAccountEvents();
};