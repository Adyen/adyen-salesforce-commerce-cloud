const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const { partialPaymentsOrder } = request;

    const cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: partialPaymentsOrder,
    };

    const response = adyenCheckout.doCancelPartialPaymentOrderCall(
      cancelOrderRequest,
    );

    if (response.resultCode === constants.RESULTCODES.RECEIVED) {
      const currentBasket = BasketMgr.getCurrentBasket();
      Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
          if (item.custom.adyenPartialPaymentsOrder) {
            currentBasket.removePaymentInstrument(item);
          }
        });
      });
      session.privacy.giftCardResponse = null;
    } else {
      throw new Error(`received resultCode ${response.resultCode}`);
    }

    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error(
      `Could not cancel partial payments order.. ${error.toString()}`,
    );
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
  }

  return next();
}

module.exports = cancelPartialPaymentOrder;
