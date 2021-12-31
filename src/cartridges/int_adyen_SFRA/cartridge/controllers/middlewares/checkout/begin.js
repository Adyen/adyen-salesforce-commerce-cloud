const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { updateSavedCards } = require('*/cartridge/scripts/updateSavedCards');

function failCreatedOrder(cachedOrderNumber) {
  const currentOrder = OrderMgr.getOrder(cachedOrderNumber);
  // if order status is CREATED we can fail it and restore basket
  if (currentOrder.status.value === Order.ORDER_STATUS_CREATED) {
    Transaction.wrap(() => {
      currentOrder.trackOrderChange(
        'Failing order so cart can be restored; Shopper navigated back to checkout during payment redirection',
      );
      OrderMgr.failOrder(currentOrder, true);
    });
    return true;
  }
  return false;
}
function restoreBasket(cachedOrderNumber) {
  // restore cart if order number was cached
  try {
    let createdOrderFailed = false;
    if (cachedOrderNumber !== undefined) {
      const currentBasket = BasketMgr.getCurrentBasket();
      if (currentBasket?.getAllProductLineItems().length > 0) {
        return createdOrderFailed;
      }
      // if current basket is null or empty
      createdOrderFailed = failCreatedOrder(cachedOrderNumber);
    }
    return createdOrderFailed;
  } catch (error) {
    Logger.getLogger('Adyen').error(`Failed to restore cart. error: ${error}`);
    return false;
  }
}

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
  }
  const cachedOrderNumber = req.session.privacyCache.get('currentOrderNumber');
  const basketRestored = restoreBasket(cachedOrderNumber);
  if (basketRestored) {
    const emit = (route) => this.emit(route, req, res);
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
    emit('route:Complete');
    return true;
  }

  const clientKey = AdyenHelper.getAdyenClientKey();
  const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  const installments = AdyenHelper.getCreditCardInstallments();
  const adyenClientKey = AdyenHelper.getAdyenClientKey();
  const googleMerchantID = AdyenHelper.getGoogleMerchantID();
  const merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  const cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  const paypalIntent = AdyenHelper.getAdyenPayPalIntent();
  const SFRA6Enabled = AdyenHelper.getAdyenSFRA6Compatibility();

  const viewData = res.getViewData();
  viewData.adyen = {
    clientKey,
    environment,
    installments,
    googleMerchantID,
    merchantAccount,
    cardholderNameBool,
    paypalIntent,
    adyenClientKey,
    SFRA6Enabled,
  };

  res.setViewData(viewData);
  return next();
}

module.exports = begin;
