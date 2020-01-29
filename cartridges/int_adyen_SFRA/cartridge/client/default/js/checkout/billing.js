'use strict';

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
        var selectedPaymentInstrument = order.billing.payment.selectedPaymentInstruments[0];
        if (selectedPaymentInstrument.paymentMethod == "CREDIT_CARD") {
            htmlToAppend += '<span>' + order.resources.cardType + ' '
                + selectedPaymentInstrument.type
                + '</span>';

            if (selectedPaymentInstrument.maskedCreditCardNumber) {
                htmlToAppend += '<div>'
                    + selectedPaymentInstrument.maskedCreditCardNumber
                    + '</div>';
            }
            if(selectedPaymentInstrument.expirationMonth && selectedPaymentInstrument.expirationYear){
                htmlToAppend += '<div><span>'
                + order.resources.cardEnding + ' '
                + selectedPaymentInstrument.expirationMonth
                + '/' + selectedPaymentInstrument.expirationYear
                + '</span></div>';
            }
        } else if (selectedPaymentInstrument.paymentMethod == "Adyen" || selectedPaymentInstrument.paymentMethod == "AdyenPOS") {
            htmlToAppend += '<div><span>'
                + selectedPaymentInstrument.selectedAdyenPM
                + '</span></div>';

            if (typeof selectedPaymentInstrument.selectedIssuerName !== "undefined") {
                htmlToAppend += '<div><span>'
                    + selectedPaymentInstrument.selectedIssuerName
                    + '</span></div>';
            }
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

module.exports = {
    methods: {
        updatePaymentInformation: updatePaymentInformation
    }
};