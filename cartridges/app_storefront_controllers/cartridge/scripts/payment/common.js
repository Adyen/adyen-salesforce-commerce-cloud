'use strict';

var ArrayList = require('dw/util/ArrayList');
var List = require('dw/util/List');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Validates payment instruments and returns valid payment instruments.
 *
 * @alias module:models/ProfileModel~ProfileModel/validateWalletPaymentInstruments
 * @param {dw.customer.Wallet|dw.order.Basket} paymentContainer - Entity that possesses payment instruments
 * @param {String} countryCode Billing country code or null.
 * @param {Number} amount Payment amount to check valid payment instruments for.
 * @returns {ArrayList} Returns an array with the valid PaymentInstruments.
 */
function validatePaymentInstruments(paymentContainer, countryCode, amount) {

    var paymentInstruments = paymentContainer.getPaymentInstruments();

    // Gets applicable payment methods.
    var methods = PaymentMgr.getApplicablePaymentMethods(customer, countryCode, amount);

    // Gets applicable payment cards from CREDIT_CARD payment method.
    var creditCardMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var cards = creditCardMethod ? creditCardMethod.getApplicablePaymentCards(customer, countryCode, amount) : List.EMPTY_LIST;

    // Collects all invalid payment instruments.
    var validPaymentInstruments = new ArrayList(paymentInstruments);
    var invalidPaymentInstruments = new ArrayList();

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        // Ignores gift certificate payment instruments.
        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            continue;
        }

        // Gets a payment method.
        var method = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        // Checks whether payment method is still applicable.
        if (method && methods.contains(method)) {
            // In case of method CREDIT_CARD, check payment cards
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                // Gets payment card.
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && cards.contains(card)) {
                    continue;
                }
            } else {
                // Continues if method is applicable.
                continue;
            }
        }

        // Collects invalid payment instruments.
        invalidPaymentInstruments.add(paymentInstrument);
        validPaymentInstruments.remove(paymentInstrument);
    }

    if (invalidPaymentInstruments.size()) {
        return {
            InvalidPaymentInstruments: invalidPaymentInstruments,
            ValidPaymentInstruments: validPaymentInstruments
        };
    } else {
        return {
            ValidPaymentInstruments: validPaymentInstruments
        };
    }
}

module.exports = {
    validatePaymentInstruments: validatePaymentInstruments
};
