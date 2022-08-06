const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const BasketMgr = require('dw/order/BasketMgr');

function callCheckBalance(req, res, next) {
    try {
        const currentBasket = BasketMgr.getCurrentBasket();
        const request = JSON.parse(req.body);
//        Logger.getLogger('Adyen').error('request is ' + JSON.stringify(request));
        let paymentMethod;
        if (request.paymentMethod) {
            paymentMethod = request.paymentMethod;
        }
//        Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));

        const checkBalanceRequest = {
            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
            amount: {
                currency: currentBasket.currencyCode,
                value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value,
            },
            reference: currentBasket.getUUID(),
            paymentMethod: paymentMethod,
        };
//        Logger.getLogger('Adyen').error('checkBalanceRequest is ' + JSON.stringify(checkBalanceRequest));

        const response = adyenCheckout.doCheckBalanceCall(checkBalanceRequest);

        res.json(response);
        return next();
    } catch (error) {
        Logger.getLogger('Adyen').error('Failed to check gift card balance');
        Logger.getLogger('Adyen').error(error);
        return next();
    }
}

module.exports = callCheckBalance;
