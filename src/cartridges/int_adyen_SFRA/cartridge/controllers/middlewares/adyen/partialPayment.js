const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Money = require('dw/value/Money');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');

function makePartialPayment(req, res, next) {
    try {
        const request = JSON.parse(req.body);

        const {paymentMethod, splitPaymentsOrder, amount} = request;

        const partialPaymentRequest = {
            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
            amount,
            reference: "partialPaymentRef",
            paymentMethod,
            order: splitPaymentsOrder,
        };

         response = adyenCheckout.doPaymentsCall(0, 0, partialPaymentRequest);
        //todo: if partial response is not authorised then cancel split payments order (or leave to auto cancel, just make sure frontend handles the case)
        Logger.getLogger('Adyen').error('partial response ' + JSON.stringify(response));
        Transaction.wrap(() => {
            session.privacy.giftCardResponse = JSON.stringify({pspReference: response.pspReference, ...response.order, ...response.amount}); //entire response exceeds string length
        });
                Logger.getLogger('Adyen').error('session.privacy.giftCardResponse ' + session.privacy.giftCardResponse);

        const remainingAmount = new Money(response.order.remainingAmount.value, response.order.remainingAmount.currency).divide(100);
        response.remainingAmountFormatted = remainingAmount.toFormattedString();
        res.json(response);
        return next();
    } catch (error) {
        Logger.getLogger('Adyen').error('Failed to create partial payment');
        Logger.getLogger('Adyen').error(error);
        return next();
    }
}

module.exports = makePartialPayment;
