const BasketMgr = require('dw/order/BasketMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const collections = require('*/cartridge/scripts/util/collections');

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const request = JSON.parse(req.body);

    Logger.getLogger('Adyen').error(
      `cancel request is ${JSON.stringify(request)}`,
    );

    const { splitPaymentsOrder } = request;

    const cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: splitPaymentsOrder,
    };

    const response = adyenCheckout.doCancelPartialPaymentOrderCall(
      cancelOrderRequest,
    );

    Logger.getLogger('Adyen').error(
      `cancel response is ${JSON.stringify(response)}`,
    );
    if (response.resultCode && response.resultCode === 'Received') {
      const currentBasket = BasketMgr.getCurrentBasket();
      Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
          Logger.getLogger('Adyen').error(`current pm is ${item}`);
          if (item.custom.adyenSplitPaymentsOrder) {
            Logger.getLogger('Adyen').error('removing current pm ');
            //                      item.custom.adyenSplitPaymentsOrder = null;
            //                      item.custom.adyenPaymentData = null;
            currentBasket.removePaymentInstrument(item);
          }
        });
      });
      session.privacy.giftCardResponse = null;
    }

    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error(`cancel error is ${JSON.stringify(error)}`);
    return next();
  }
}

module.exports = cancelPartialPaymentOrder;
