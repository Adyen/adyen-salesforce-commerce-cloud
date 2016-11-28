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
	    	e.preventDefault();
	    	var currentDate = new Date();
	    	var dateField = currentDate.getUTCFullYear() + '-' + pad( currentDate.getUTCMonth() + 1 ) + '-' + pad( currentDate.getUTCDate() ) + 'T' + pad( currentDate.getUTCHours() ) + ':' + pad( currentDate.getUTCMinutes() ) + ':' + pad( currentDate.getUTCSeconds() ) + '.'
	        + ( currentDate.getUTCMilliseconds() / 1000 ).toFixed( 3 ).slice( 2, 5 ) + 'Z';
	
	        var $creditCard = $('[data-method="CREDIT_CARD"]');
	        
	        // the public key
	        var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;
	        
	        var options = {};
	        var cseInstance = adyen.encrypt.createEncryption(key, options);
	        var postData = {};

	        var cardData = {
		            number : $('#adyen_creditCard_number').val(),
		            cvc : $('#adyen_creditCard_cvn_value').val(),
		            holderName : $('#adyen_creditCard_owner').val(),
		            expiryMonth : $('#adyen_creditCard_month').val(),
		            expiryYear : $('#adyen_creditCard_year').val(),
		            generationtime : dateField
		        };
	        
	        postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
	        if (postData['adyen-encrypted-data'] == false) {
	        	$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
	        } else {
	        	$('.form-data-error').html('');
		        $('#dwfrm_billing_paymentMethods_creditCard_encrypteddata').val(postData['adyen-encrypted-data']);
		        $('#billing-submit-hidden').trigger('click');
	        }
		}
    });
}

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */
exports.initBilling = function () {
	initializeBillingEvents();
};
