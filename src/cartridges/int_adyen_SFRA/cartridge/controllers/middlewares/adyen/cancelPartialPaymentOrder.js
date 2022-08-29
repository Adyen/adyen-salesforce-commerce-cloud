const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const collections = require('*/cartridge/scripts/util/collections');

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const { splitPaymentsOrder } = request;

    const cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: splitPaymentsOrder,
    };

    const response = adyenCheckout.doCancelPartialPaymentOrderCall(
      cancelOrderRequest,
    );

    if (response.resultCode && response.resultCode === 'Received') {
      const currentBasket = BasketMgr.getCurrentBasket();
      Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
          if (item.custom.adyenSplitPaymentsOrder) {
            currentBasket.removePaymentInstrument(item);
          }
        });
      });
      session.privacy.giftCardResponse = null;
    }

    res.json(response);
    return next();
  } catch (error) {
    return next();
  }
}

module.exports = cancelPartialPaymentOrder;
