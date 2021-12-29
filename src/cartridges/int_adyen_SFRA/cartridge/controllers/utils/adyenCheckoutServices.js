const constants = require('*/cartridge/adyenConstants/constants');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');

function processPayment(order, handlePaymentResult, req, res, emit) {
    const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
    )[0];
    if (handlePaymentResult.threeDS2) {
        Transaction.wrap(() => {
            paymentInstrument.custom.adyenAction = handlePaymentResult.action;
        });
        res.json({
            error: false,
            order,
            continueUrl: URLUtils.url('Adyen-Adyen3DS2', 'resultCode', handlePaymentResult.resultCode, 'orderNo', order.orderNo,).toString(),
        });
        emit('route:Complete');
    } else if (handlePaymentResult.redirectObject) {
        //If authorized3d, then redirectObject from credit card, hence it is 3D Secure
        if (handlePaymentResult.authorized3d) {
            Transaction.wrap(() => {
                paymentInstrument.custom.adyenMD =
                    handlePaymentResult.redirectObject.data.MD;
            });
            res.json({
                error: false,
                continueUrl: URLUtils.url(
                    'Adyen-Adyen3D',
                    'IssuerURL',
                    handlePaymentResult.redirectObject.url,
                    'PaRequest',
                    handlePaymentResult.redirectObject.data.PaReq,
                    'MD',
                    handlePaymentResult.redirectObject.data.MD,
                    'merchantReference',
                    handlePaymentResult.orderNo,
                    'signature',
                    handlePaymentResult.signature,
                ).toString(),
            });
            emit('route:Complete');
        } else {
            Transaction.wrap(() => {
                paymentInstrument.custom.adyenRedirectURL =
                    handlePaymentResult.redirectObject.url;
            });
            res.json({
                error: false,
                continueUrl: URLUtils.url(
                    'Adyen-Redirect',
                    'merchantReference',
                    handlePaymentResult.orderNo,
                    'signature',
                    handlePaymentResult.signature,
                ).toString(),
            });
            emit('route:Complete');
        }
    }
}

module.exports = processPayment;