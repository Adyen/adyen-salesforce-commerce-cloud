/* eslint-disable */
'use strict';

var util = require('./util'),
ajax = require('./ajax');

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

	initializeCheckout(window.AdyenLocale);
	initializeCardComponent(document.getElementById('card'), window.AdyenOriginKey, window.AdyenLoadingContext);
	
	$('#billing-submit').on('click', function (e) {
		var radioVal = $('.payment-method-options').find(':checked').val();
		if ('CREDIT_CARD' == radioVal){
			e.preventDefault();
			
			var card = window.AdyenCard;
			$('#dwfrm_billing_paymentMethods_creditCard_type').val(card.state.brand);
            $('#dwfrm_billing_paymentMethods_creditCard_encryptedCardNumber').val(card.paymentData.encryptedCardNumber);
            $('#dwfrm_billing_paymentMethods_creditCard_encryptedExpiryMonth').val(card.paymentData.encryptedExpiryMonth);
            $('#dwfrm_billing_paymentMethods_creditCard_encryptedExpiryYear').val(card.paymentData.encryptedExpiryYear);
            $('#dwfrm_billing_paymentMethods_creditCard_encryptedSecurityCode').val(card.paymentData.encryptedSecurityCode);
			
			var creditCard = $('[data-method="CREDIT_CARD"]'),
	        		selectedCardID = creditCard.find('input[name$="_selectedCardID"]'),
				encryptedData = $('#dwfrm_billing_paymentMethods_creditCard_encrypteddata'),
				encryptedDataValue,
	        		options = {};
   
	        /**
	         * We need encrypt only CVC if we used already saved CC from dropdown list
	         */
	        if ($('#creditCard_number').val().indexOf('*') > -1 && selectedCardID != null && selectedCardID.val() !== '') {
	        		var cardData = getCardData(true);
	            options = { enableValidations: false};
	        } else {
	        		var cardData = getCardData(false);
	        }
            if (($('#creditCard_number').val().indexOf('*') > -1 || $('#creditCard_cvn').val().indexOf('*') > -1) && encryptedData != null && encryptedData.val() !== '') {
            		encryptedDataValue = encryptedData.val();
            } else {
            		var cseInstance = adyen.createEncryption(options);
            		encryptedDataValue = cseInstance.encrypt(cardData);
            }
            
            // Clear selectedCardID field if user enter a card number
            if ($('#creditCard_number').val().indexOf('*') === -1) {
                selectedCardID.val('');
            }

            if (encryptedDataValue === false) {
	        		$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
	        } else {
		        	$('.form-data-error').html('');
		        	encryptedData.val(encryptedDataValue);
		        	$('#creditCard_number').val(maskValue($('#creditCard_number').val()));
			    $('#billing-submit-hidden').trigger('click');
	        }
		}
    });
	$('#adyenCreditCardList').on('change', function () {
		var cardUUID = $(this).val();
		if (!cardUUID) {
			// TODO: clear all fields
			$('.checkout-billing').find('input[name$="_selectedCardID"]').val('');
			$('#creditCard_owner').removeAttr("disabled").val('');
			$('#dwfrm_billing_paymentMethods_creditCard_type').removeAttr("disabled").val($("#dwfrm_billing_paymentMethods_creditCard_type option:first").val());
			$('#creditCard_number').removeAttr("disabled").val('');
			$('#creditCard_expiration_month').val('');
			$('#creditCard_expiration_year').val('');
			$('#creditCard_expiration_cvn').val('');	
			// show the save card input and label because it is a new card
		    $('#dwfrm_billing_paymentMethods_creditCard_saveCard').show();
		    $('label[for="dwfrm_billing_paymentMethods_creditCard_saveCard"]').show();
		} else {
			populateAdyenCreditCardForm(cardUUID);
		}
	});
	
	/**
	 * @function
	 * @description Fills the Credit Card form with the passed data-parameter and clears the former cvn input
	 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
	 */
	function setAdyenCCFields(data) {
	    var $creditCard = $('[data-method="CREDIT_CARD"]');
	    $('#creditCard_owner').val(data.holder).trigger('change').attr('disabled', 'disabled');
	    $creditCard.find('select[name$="_type"]').val(data.type).trigger('change').attr('disabled', 'disabled');;
	    $('#creditCard_number').val(data.maskedNumber).trigger('change').attr('disabled', 'disabled');
	    $('#creditCard_expiration_month').val(data.expirationMonth).trigger('change');
	    $('#creditCard_expiration_year').val(data.expirationYear).trigger('change');
	    $('#creditCard_expiration_cvn').val('').trigger('change');
	    $creditCard.find('[name$="creditCard_selectedCardID"]').val(data.selectedCardID).trigger('change');
	    // hide the save card input and label because it is a stored card
	    $('#dwfrm_billing_paymentMethods_creditCard_saveCard').hide();
	    $('label[for="dwfrm_billing_paymentMethods_creditCard_saveCard"]').hide();
	}

	/**
	 * @function
	 * @description Updates the credit card form with the attributes of a given card
	 * @param {String} cardID the credit card ID of a given card
	 */
	function populateAdyenCreditCardForm(cardID) {
	    // load card details
	    var url = util.appendParamToURL(Urls.billingSelectCC, 'creditCardUUID', cardID);
	    ajax.getJson({
	        url: url,
	        callback: function (data) {
	            if (!data) {
	                window.alert(Resources.CC_LOAD_ERROR);
	                return false;
	            }
	            setAdyenCCFields(data);
	        }
	    });
	}
}

/**
 * @function
 * @description Initializes Adyen CSE My Account events
 */
function initializeAccountEvents() {
    $('#add-card-submit').on('click', function (e) {
    		// TODO: fix this to use IDs and we need to change template to not use name attributes
        e.preventDefault();
        var $creditCard = $('#CreditCardForm'),
        		encryptedData = $('#dwfrm_paymentinstruments_creditcards_newcreditcard_encrypteddata'),
        		encryptedDataValue,
        		options = {};
      
        var cardData = getCardData(false);
    
    		var cseInstance = adyen.createEncryption(options);
    		encryptedDataValue = cseInstance.encrypt(cardData);
           
        if (encryptedDataValue === false) {
        		$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
        } else {
	        	$('.form-data-error').html('');
	        	encryptedData.val(encryptedDataValue);
	        	$('#creditCard_number').val(maskValue($('#creditCard_number').val()));
		    $('#add-card-submit-hidden').trigger('click');
        }
    });
}

function initializeCheckout(locale) {
	
	var configuration = {
	        locale: locale, // Defaults to en_US
	        translations: {} // Override translations
	};

	window.AdyenCheckoutObject = new AdyenCheckout(configuration);
}

function initializeCardComponent(cardNode, originKey, loadingContext) {
	window.AdyenCard = checkout.create('card', {
        // Mandatory fields
        originKey: originKey,
        loadingContext: loadingContext, // The environment where we should loads the secured fields from
        type: 'card',

        // Events
        onChange: function(state) {
            isValid = state.isValid;
        }, // Gets triggered whenever a user changes input
        onBrand: function(brandObject) {
            $('#cardType').val(brandObject.brand);
        }, // Called once we detect the card brand
        onBinValue: function(bin) {
            $('#cardNumber').val(bin.binValue);
        } // Provides the BIN Number of the card (up to 6 digits), called as the user types in the PAN
    });
    window.AdyenCard.mount(cardNode);	
}

/**
 * If selectedCard is used do not encrypt the number and holderName field
 * @param selectedCard
 * @returns
 */
function getCardData(selectedCard) {
	
	var cardData = {
            cvc : $('#creditCard_cvn').val(),
            expiryMonth : $('#creditCard_expiration_month').val(),
            expiryYear : $('#creditCard_expiration_year').val(),
            generationtime : $('#adyen_generationtime').val()
    };
	
	if (!selectedCard) {
		cardData.number = $('#creditCard_number').val();
		cardData.holderName = $('#creditCard_owner').val();
	}
	
	return cardData;
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

