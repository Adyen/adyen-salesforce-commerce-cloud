'use strict';

var server = require('server');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');

function getEncryptedData() {
    var paymentForm = server.forms.getForm('billing');
    return paymentForm.creditCardFields.adyenEncryptedData.value;
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    Logger.getLogger("Adyen").error("viewData = " + JSON.stringify(viewFormData));
    Logger.getLogger("Adyen").error("paymentForm = " + JSON.stringify(paymentForm));
    Logger.getLogger("Adyen").error("req = " + JSON.stringify(req));
    var array = require('*/cartridge/scripts/util/array');
    var viewData = viewFormData;
    var creditCardErrors = {};

    if (!req.form.storedPaymentUUID) {
        // verify credit card form data
        creditCardErrors = COHelpers.validateCreditCard(paymentForm);
    }

    if (Object.keys(creditCardErrors).length) {
        return {
            fieldErrors: creditCardErrors,
            error: true
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };
    Logger.getLogger("Adyen").error("paymentForm.adyenPaymentFields = " + JSON.stringify(paymentForm.adyenPaymentFields));
    var stateData = JSON.parse(paymentForm.adyenPaymentFields.adyenStateData.value);
    Logger.getLogger("Adyen").error("stateData = " + JSON.stringify(stateData));

    viewData.adyenEncryptedCardNumber = stateData.paymentMethod.encryptedCardNumber.value;
    viewData.adyenEncryptedExpiryMonth = stateData.paymentMethod.encryptedExpiryMonth.value;
    viewData.adyenEncryptedExpiryYear = stateData.paymentMethod.encryptedExpiryYear.value;
    viewData.adyenEncryptedSecurityCode = stateData.paymentMethod.encryptedSecurityCode.value;

    viewData.paymentInformation = {
        cardType: {
            value: "visa"
        },
        cardNumber: {
            value: paymentForm.creditCardFields.cardNumber.value
        },
        expirationMonth: {
            value: parseInt(paymentForm.creditCardFields.expirationMonth.selectedOption, 10)
        },
        expirationYear: {
            value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10)
        },
        securityCode: {
            value: paymentForm.creditCardFields.adyenEncryptedSecurityCode.value
        }
    };

    if (paymentForm.creditCardFields.selectedCardID) {
        viewData.storedPaymentUUID = paymentForm.creditCardFields.selectedCardID.value;
    }

    viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

    // process payment information
    if (viewData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
    ) {
        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var paymentInstrument = array.find(paymentInstruments, function (item) {
            return viewData.storedPaymentUUID === item.UUID;
        });

        viewData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
        viewData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
        viewData.paymentInformation.securityCode.value = req.form.securityCode;
        viewData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
        viewData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
        viewData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
    }

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    if (!billingData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && billingData.saveCard
        && (billingData.paymentMethod.value === 'CREDIT_CARD')
    ) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var saveCardResult = COHelpers.savePaymentInstrumentToWallet(
            billingData,
            basket,
            customer
        );

        req.currentCustomer.wallet.paymentInstruments.push({
            creditCardHolder: saveCardResult.creditCardHolder,
            maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
            creditCardType: saveCardResult.creditCardType,
            creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
            creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
            UUID: saveCardResult.UUID,
            creditCardNumber: Object.hasOwnProperty.call(
                saveCardResult,
                'creditCardNumber'
            )
                ? saveCardResult.creditCardNumber
                : null,
            raw: saveCardResult
        });
    }
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
