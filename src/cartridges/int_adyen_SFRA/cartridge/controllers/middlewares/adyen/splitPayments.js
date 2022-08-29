const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const BasketMgr = require('dw/order/BasketMgr');

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

function createSplitPaymentsOrder(req, res, next) {
    try {
//        Logger.getLogger('Adyen').error('inside  createSplitPaymentsOrder');
        const currentBasket = BasketMgr.getCurrentBasket();
        const request = JSON.parse(req.body);
//        Logger.getLogger('Adyen').error('request is ' + JSON.stringify(request));
        let paymentMethod;
        if (request.paymentMethod) {
            paymentMethod = request.paymentMethod;
        }
//        Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));

        let date = new Date();
        date = addMinutes(date, 30);

        const splitPaymentsRequest = {
            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
            amount: {
                currency: currentBasket.currencyCode,
                value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value,
            },
            reference: currentBasket.getUUID(),
            expiresAt: date.toISOString(),
        };
//        Logger.getLogger('Adyen').error('splitPaymentsRequest is ' + JSON.stringify(splitPaymentsRequest));

        const response = adyenCheckout.doCreateSplitPaymentOrderCall(splitPaymentsRequest);

//        Logger.getLogger('Adyen').error('split payments response is ' + JSON.stringify(response));

        res.json(response);
        return next();
    } catch (error) {
        Logger.getLogger('Adyen').error('Failed to create split payments order');
        Logger.getLogger('Adyen').error(error);
        return next();
    }
}

module.exports = createSplitPaymentsOrder;
