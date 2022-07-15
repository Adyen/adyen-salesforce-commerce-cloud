const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const BasketMgr = require('dw/order/BasketMgr');

function makePartialPayment(req, res, next) {
    try {
        Logger.getLogger('Adyen').error('inside  makePartialPayment');
        // const currentBasket = BasketMgr.getCurrentBasket();
        const request = JSON.parse(req.body);
        Logger.getLogger('Adyen').error('request is ' + JSON.stringify(request));

        const {paymentMethod, splitPaymentsOrder, amount} = request;

        const partialPaymentRequest = {
            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
            amount,
            reference: "partialPaymentRef",
            paymentMethod,
            order: splitPaymentsOrder,
        };
        Logger.getLogger('Adyen').error('partialPaymentrequest is ' + JSON.stringify(partialPaymentRequest));

        const response = adyenCheckout.doPaymentsCall(0, 0, partialPaymentRequest);

        Logger.getLogger('Adyen').error('partial payment response is ' + JSON.stringify(response));

        res.json(response);
        return next();
    } catch (error) {
        Logger.getLogger('Adyen').error('Failed to create partial payment');
        Logger.getLogger('Adyen').error(error);
        return next();
    }
}

module.exports = makePartialPayment;
