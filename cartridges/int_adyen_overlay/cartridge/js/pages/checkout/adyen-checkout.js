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
            var selectedPaymentType = $('.payment-method-options').find(':checked').val();
            if (selectedPaymentType == "CREDIT_CARD") {

                if (!window.CardValid) {
                    window.AdyenCard.showValidation();
                    return false;
                }
                clearCardData();
                var oneClickCard = window.AdyenOneClick;
                if (isOneClick) {
                    $('#dwfrm_billing_paymentMethods_creditCard_selectedCardID').val($('#adyenCreditCardList option:selected').attr('id'));
                    $('#dwfrm_billing_paymentMethods_creditCard_type').val($('#adyenCreditCardList option:selected').val());
                    $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedSecurityCode').val(oneClickCard.state.data.encryptedSecurityCode);
                }
                else {
                    $('#dwfrm_billing_paymentMethods_creditCard_selectedCardID').val("");
                    copyCardData(window.AdyenCard);
                }
            }
            else if (selectedPaymentType == "Adyen"){
                var selectedMethod = $('[name="brandCode"]:checked').val();
                return componentDetailsValid(selectedMethod);
            }
            else if (selectedPaymentType == "AdyenPOS"){
                $("#dwfrm_adyPaydata_terminalId").val($("#terminalId").val());
                return true;
            }

            e.preventDefault();
            $('.form-data-error').html('');
            $('#billing-submit-hidden').trigger('click');
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
        var cardNode = document.getElementById('oneClickCard');
        window.AdyenOneClick = AdyenCheckoutObject.create('card', {
            // Mandatory fields
            brand: selectedCard,
            storedPaymentMethodId: "1",
            onChange: function (state) {
                $('#dwfrm_billing_paymentMethods_creditCard_browserInfo').val(JSON.stringify(state.data.browserInfo));
                window.CardValid = state.isValid;
            }
        });
        window.AdyenOneClick.mount(cardNode);
    }

    function parseOpenInvoiceComponentData(state) {
        $('#dwfrm_adyPaydata_dateOfBirth').val(state.data.personalDetails.dateOfBirth);
        $('#dwfrm_adyPaydata_telephoneNumber').val(state.data.personalDetails.telephoneNumber);
        $('#dwfrm_adyPaydata_gender').val(state.data.personalDetails.gender);
    }

    //Check the validity of checkout component
    function componentDetailsValid(selectedMethod){
        //set data from components
        switch(selectedMethod) {
            case "ideal":
                if (idealComponent.componentRef.state.isValid) {
                    $('#dwfrm_adyPaydata_issuer').val(idealComponent.componentRef.state.data.issuer);
                }
                return idealComponent.componentRef.state.isValid;
                break;
            case "klarna":
                if(klarnaComponent){
                    if (klarnaComponent.componentRef.state.isValid) {
                        parseOpenInvoiceComponentData(klarnaComponent.componentRef.state);
                        if($('#ssnValue')){
                            $('#dwfrm_adyPaydata_socialSecurityNumber').val($('#ssnValue').val());
                        }
                    }
                    return klarnaComponent.componentRef.state.isValid;
                }
                else{
                    //New Klarna integration is without component
                    return true;
                }
                break;
            case "afterpay_default":
                if (afterpayComponent.componentRef.state.isValid) {
                    parseOpenInvoiceComponentData(afterpayComponent.componentRef.state);
                }
                return afterpayComponent.componentRef.state.isValid;
                break;
            case "ratepay":
                $('#dwfrm_adyPaydata_dateOfBirth').val($("#ratepay_dob").val());
                $('#dwfrm_adyPaydata_gender').val($("#ratepay_gender").val());
                return true;
            default:
                return true;
        }
    }

    function copyCardData(card) {
        $('#dwfrm_billing_paymentMethods_creditCard_type').val(card.state.brand);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedCardNumber').val(card.state.data.encryptedCardNumber);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryMonth').val(card.state.data.encryptedExpiryMonth);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedExpiryYear').val(card.state.data.encryptedExpiryYear);
        $('#dwfrm_billing_paymentMethods_creditCard_adyenEncryptedSecurityCode').val(card.state.data.encryptedSecurityCode);
        $('#dwfrm_billing_paymentMethods_creditCard_owner').val(card.state.data.holderName);
        if(window.storeDetails){
            $('#dwfrm_billing_paymentMethods_creditCard_saveCard').val(window.storeDetails);
        }
        else {
            $('#dwfrm_billing_paymentMethods_creditCard_saveCard').val(false);
        }
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
     * @description Initializes Adyen Checkout My Account events
     */
    function initializeAccountEvents() {
        $('#add-card-submit').on('click', function (e) {
            e.preventDefault();
            if (window.AdyenCard.isValid) {
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


