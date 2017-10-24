/* eslint-disable */
'use strict';

function pad ( number ) {
    if ( number < 10 ) {
        return '0' + number;
    }
    return number;
}

/**
 * @function
 * @description Initializes Adyen CSE  Billing events
 */
function initializeBillingEvents() {

	$('#billing-submit').on('click', function (e) {
		var radioVal = $('.payment-method-options').find(':checked').val();
		if ('CREDIT_CARD' == radioVal){
		    var $creditCard = $('[data-method="CREDIT_CARD"]');
	        var $selectedCardID = $creditCard.find('input[name$="_selectedCardID"]');

			e.preventDefault();
	    	var currentDate = new Date();
	    	var dateField = currentDate.getUTCFullYear() + '-' + pad( currentDate.getUTCMonth() + 1 ) + '-' + pad( currentDate.getUTCDate() ) + 'T' + pad( currentDate.getUTCHours() ) + ':' + pad( currentDate.getUTCMinutes() ) + ':' + pad( currentDate.getUTCSeconds() ) + '.'
	        + ( currentDate.getUTCMilliseconds() / 1000 ).toFixed( 3 ).slice( 2, 5 ) + 'Z';

	        var $creditCard = $('[data-method="CREDIT_CARD"]');
	        var $encryptedData = $('#dwfrm_billing_paymentMethods_creditCard_encrypteddata');
	        var $ccNum = $creditCard.find('input[name*="_creditCard_number"]');

	        // the public key
	        var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;

	        var options = {};
	        var cseInstance = adyen.encrypt.createEncryption(key, options);
	        var postData = {};
            
	        var cardNumber = $creditCard.find('input[name*="_creditCard_number"]').val();
	        var cvc = $creditCard.find('input[name*="_cvn"]').val();
	        
	        /**
	         * We need encrypt only CVC if we used already saved CC from dropdown list
	         */
	        if (cardNumber.indexOf('*') > -1 && $selectedCardID != null && $selectedCardID.val() !== '') {
	            var cardData = {
                        cvc : $creditCard.find('input[name*="_cvn"]').val(),
                        generationtime : dateField
                    };
	        } else {
    	        var cardData = {
    		            number : $creditCard.find('input[name*="_creditCard_number"]').val(),
    		            cvc : $creditCard.find('input[name*="_cvn"]').val(),
    		            holderName : $creditCard.find('input[name$="creditCard_owner"]').val(),
    		            expiryMonth : $creditCard.find('[name$="_month"]').val(),
    		            expiryYear : $creditCard.find('[name$="_year"]').val(),
    		            generationtime : dateField
    		        };
	        }
            if ((cardNumber.indexOf('*') > -1 || cvc.indexOf('*') > -1) && $encryptedData != null && $encryptedData.val() !== '') {
                postData['adyen-encrypted-data'] = $encryptedData.val();
            } else {
                postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
            }
            
            // Clear selectedCardID field if user enter a card number
            if (cardNumber.indexOf('*') === -1) {
                $selectedCardID.val('');
            }

            if (postData['adyen-encrypted-data'] === false) {
	        	$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
	        } else {
	        	$('.form-data-error').html('');
	        	$encryptedData.val(postData['adyen-encrypted-data']);
	        	$ccNum.val(maskValue($ccNum.val()));
		        $('#billing-submit-hidden').trigger('click');
	        }
		}
    });
	$('#creditCardList').on('change', function () {
		var cardUUID = $(this).val();
		if (!cardUUID)
			$('.checkout-billing').find('input[name$="_selectedCardID"]').val('');
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

exports.initAccount = function() {
	initializeAccountEvents();
};

