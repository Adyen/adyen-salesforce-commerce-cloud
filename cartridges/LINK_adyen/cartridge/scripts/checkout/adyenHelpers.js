'use strict';
var server = require('server');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');

/**
 * saves payment instruemnt to customers wallet
 * @param {Object} billingData - billing information entered by the user
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {dw.customer.Customer} customer - The current customer
 * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
 */
function savePaymentInstrumentToWallet(billingData, currentBasket, customer) {
    Logger.getLogger("Adyen").error("savePaymentInstrumentToWallet billingData: " + JSON.stringify(billingData) + "currentBasket: " + JSON.stringify(currentBasket));
    var wallet = customer.getProfile().getWallet();

    //TODOBAS
    return Transaction.wrap(function () {
        var storedPaymentInstrument = wallet.createPaymentInstrument('CREDIT_CARD');

        storedPaymentInstrument.setCreditCardHolder(
            currentBasket.billingAddress.fullName
        );
        storedPaymentInstrument.setCreditCardNumber(
            billingData.paymentInformation.cardNumber.value
        );
        storedPaymentInstrument.setCreditCardType(
            billingData.paymentInformation.cardType.value
        );
        storedPaymentInstrument.setCreditCardExpirationMonth(
            billingData.paymentInformation.expirationMonth.value
        );
        storedPaymentInstrument.setCreditCardExpirationYear(
            billingData.paymentInformation.expirationYear.value
        );

        var token = HookMgr.callHook(
            'app.payment.processor.basic_credit',
            'createMockToken'
        );

        storedPaymentInstrument.setCreditCardToken(token);

        return storedPaymentInstrument;
    });
}

module.exports = {
    savePaymentInstrumentToWallet: savePaymentInstrumentToWallet
};
