const constants = require('*/cartridge/adyenConstants/constants');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');

function processPayment(order, handlePaymentResult, req, res, emit) {
    const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
    )[0];

    res.json({
        error: false,
        adyenAction: handlePaymentResult.action,
        orderID: order.orderNo,
        orderToken: order.orderToken,
    });
    emit('route:Complete');
}

module.exports = processPayment;