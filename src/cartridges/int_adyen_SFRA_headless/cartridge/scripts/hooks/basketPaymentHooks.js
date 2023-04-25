// eslint-disable-next-line no-unused-vars
exports.beforeGET = function (basket) {
    const adyenCheckout = require('*/cartridge/scripts/adyenSessions');
    adyenCheckout.createSession(basket, customer, 'NL')
};

// exports.afterGET = function (order, paymentMethods) {
//     /** Provide additional information on how to finalize the payment. Should be implemented per payment type */
//     var result;
//     request.custom.paymentMethodId = paymentInstrument.paymentMethodId;

//     result = {
//         action: 'REDIRECT',
//         url: 'https://headlesspayments.net/express'
//     };

//     request.custom.mockPspResult = JSON.stringify(result);
// };

// eslint-disable-next-line no-unused-vars
// exports.modifyGETResponse_v2 = function (basket, basketResponse) {
//     // retrieve payment, responsible for this hook execution
//     var addedPayment = basketResponse.paymentInstruments.toArray().filter(function (instr) {
//         return instr.paymentMethodId === request.custom.paymentMethodId;
//     })[0];

//     // simulate 2 step payment and calculation of multi payments
//     var amountLeft = basket.getTotalGrossPrice();
//     var paidAmount = 0;
//     basket.paymentInstruments.toArray().forEach(function (instrument) {
//         paidAmount += instrument.paymentTransaction.getAmount().value;
//     });
//     amountLeft = basket.getTotalGrossPrice().subtract(new dw.value.Money(paidAmount, basket.getCurrencyCode()));
//     addedPayment.c_amountToAuthorize = { value: amountLeft.value, currencyCode: amountLeft.currencyCode };
//     addedPayment.c_action = JSON.parse(request.custom.mockPspResult);
// };