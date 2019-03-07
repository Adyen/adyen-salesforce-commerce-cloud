    /* eslint-disable */
    'use strict';

    var util = require('./util'),
        ajax = require('./ajax');

    function pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }

    /**
     * @function
     * @description Initializes Adyen Secured Fields  Billing events
     */
    function initializeBillingEvents() {
        var isOneClick = false;
        $('#billing-submit').on('click', function (e) {
            var radioVal = $('.payment-method-options').find(':checked').val();
            if ('CREDIT_CARD' == radioVal) {

                if (!window.CardValid) {
                    return false;
                }
                clearCardData();
                var oneClickCard = window.AdyenOneClick;
                if (isOneClick) {
                    $('#dwfrm_billing_paymentMethods_creditCard_selectedCardID').val($('#adyenCreditCardList option:selected').attr('id'));
                    $('#dwfrm_billing_paymentMethods_creditCard_type').val($('#adyenCreditCardList option:selected').val());
                    $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedSecurityCode').val(oneClickCard.paymentData.encryptedSecurityCode);
                }
                else {
                    $('#dwfrm_billing_paymentMethods_creditCard_selectedCardID').val("");
                    copyCardData(window.AdyenCard);
                }
                
                e.preventDefault();
                $('.form-data-error').html('');
                $('#billing-submit-hidden').trigger('click');

            }
        });

        $('#adyenCreditCardList').on('change', function () {
        	var selectedCard = $('#adyenCreditCardList').val();
        	var AdyenCheckoutObject = new AdyenCheckout(window.Configuration);
        	if(window.AdyenOneClick){
        		window.AdyenOneClick.unmount();
        	}
        	initializeOneClick(AdyenCheckoutObject, selectedCard);
        	window.CardValid = false;
            if (selectedCard !== "") {
                isOneClick = true;
                $("#selectedCard").slideDown("slow");
                $("#newCard").slideUp("slow");
                
            }
            else {
                isOneClick = false;
                $("#selectedCard").slideUp("slow");
                $("#newCard").slideDown("slow");
            }
        });
    }
    
    function initializeOneClick(AdyenCheckoutObject, selectedCard) {
    	var hideCVC = false;
    	if(selectedCard == "bcmc"){
    		hideCVC = true;
    	}
    	
	    var cardNode = document.getElementById('oneClickCard');
        window.AdyenOneClick = AdyenCheckoutObject.create('card', {
            // Mandatory fields
            type: selectedCard,
            details: [{"key":"cardDetails.cvc","type":"cvc"}], // <--- Pass the specific details for this paymentMethod
            oneClick: true, //<--- enable oneClick 'mode'
            hideCVC: hideCVC,
            storedDetails: {
                "card": {
                    "expiryMonth": "",
                    "expiryYear": "",
                    "holderName": "",
                    "number": ""
                }
            },
            // Events
            onChange: function(state) {
                // checks whether card was valid then was changed to be invalid
            	if(selectedCard == "maestro"){
            		window.CardValid = true;
            	}
            	else {
            		window.CardValid = state.isValid;
            	}
            }
        });
        window.AdyenOneClick.mount(cardNode);
    }

    function copyCardData(card) {
        $('#dwfrm_billing_paymentMethods_creditCard_type').val(card.state.brand);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedCardNumber').val(card.paymentData.encryptedCardNumber);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryMonth').val(card.paymentData.encryptedExpiryMonth);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryYear').val(card.paymentData.encryptedExpiryYear);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedSecurityCode').val(card.paymentData.encryptedSecurityCode);
        $('#dwfrm_billing_paymentMethods_creditCard_owner').val(card.paymentData.holderName);
    }
    
    function clearCardData() {
        $('#dwfrm_billing_paymentMethods_creditCard_type').val("");
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedCardNumber').val("");
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryMonth').val("");
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryYear').val("");
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedSecurityCode').val("");
        $('#dwfrm_billing_paymentMethods_creditCard_owner').val("");
    }

    /**
     * @function
     * @description Initializes Adyen CSE My Account events
     */
    function initializeAccountEvents() {
        $('#add-card-submit').on('click', function (e) {
        	e.preventDefault();
            if (window.AdyenCard.isValid()) {
            	copyCardData(window.AdyenCard);
            	$('#add-card-submit-hidden').trigger('click');
            }
        });
    }


    /**
     * If selectedCard is used do not encrypt the number and holderName field
     * @param selectedCard
     * @returns
     */
    function getCardData(selectedCard) {

        var cardData = {
            cvc: $('#creditCard_cvn').val(),
            expiryMonth: $('#creditCard_expiration_month').val(),
            expiryYear: $('#creditCard_expiration_year').val(),
            generationtime: $('#adyen_generationtime').val()
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

exports.initBilling = function() {
	initializeBillingEvents();
};    

exports.initAccount = function() {
	initializeAccountEvents();
};