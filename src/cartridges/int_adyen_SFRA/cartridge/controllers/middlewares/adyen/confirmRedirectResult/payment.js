const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function handlePaymentError({ res, next }) {
    res.redirect(
        URLUtils.url(
            'PaymentInstruments-AddPayment',
            Resource.msg('error.payment.not.valid', 'addPayment', null),
        ),
    );
    return next();
}

function handlePayment(stateData, options) {

    if (!stateData?.redirectResult) {
        return handlePaymentError(options);
    }

    return adyenCheckout.doPaymentDetailsCall({
        details: {
            redirectResult: decodeURI(stateData.redirectResult)
        }
    });
}

module.exports = handlePayment;
