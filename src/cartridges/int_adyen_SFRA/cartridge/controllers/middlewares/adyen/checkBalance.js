const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function callCheckBalance(req, res, next) {
    try {
        const request = JSON.parse(req.body);
        let paymentMethod;
        if (request.data) {
            paymentMethod = request.data;
        }

        const checkBalanceRequest = {
            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
            amount: {
                currency: basket.currencyCode,
                value: AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()).value,
            },
            reference: basket.getUUID(),
            paymentMethod: paymentMethod,
        };

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
