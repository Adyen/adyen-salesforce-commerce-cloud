const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const {
  updateSavedCards,
} = require('*/cartridge/adyen/scripts/payments/updateSavedCards');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');

function shouldRestoreBasket(cachedOrderNumber) {
  // restore cart if order number was cached
  if (cachedOrderNumber) {
    const currentBasket = BasketMgr.getCurrentBasket();
    // check if cart is null or empty
    if (!currentBasket || currentBasket.getAllProductLineItems().length === 0) {
      return true;
    }
  }
  return false;
}

function restoreBasket(cachedOrderNumber, cachedOrderToken) {
  const currentOrder = OrderMgr.getOrder(cachedOrderNumber, cachedOrderToken);
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

function getAdyenViewData() {
  const clientKey = AdyenConfigs.getAdyenClientKey();
  const environment = AdyenHelper.getCheckoutEnvironment();
  const installments = AdyenConfigs.getAdyenInstallmentsEnabled()
    ? AdyenConfigs.getCreditCardInstallments()
    : {};
  const adyenClientKey = AdyenConfigs.getAdyenClientKey();
  const googleMerchantID = AdyenConfigs.getGoogleMerchantID();
  const merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  const SFRA6Enabled = AdyenConfigs.getAdyenSFRA6Compatibility();
  return {
    clientKey,
    environment,
    installments,
    googleMerchantID,
    merchantAccount,
    adyenClientKey,
    SFRA6Enabled,
  };
}

function begin(req, res, next) {
  try {
    if (req.currentCustomer.raw.isAuthenticated()) {
      updateSavedCards({
        CurrentCustomer: req.currentCustomer.raw,
      });
    }

    const cachedOrderNumber =
      req.session.privacyCache.get('currentOrderNumber');
    const cachedOrderToken = req.session.privacyCache.get('currentOrderToken');
    if (shouldRestoreBasket(cachedOrderNumber)) {
      if (restoreBasket(cachedOrderNumber, cachedOrderToken)) {
        const emit = (route) => this.emit(route, req, res);
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
        emit('route:Complete');
        return true;
      }
    }
    const viewData = res.getViewData();
    viewData.adyen = getAdyenViewData();
    res.setViewData(viewData);
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not begin checkout:', error);
    setErrorType(error, res, {
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', 'general').toString(),
    });
    return next();
  }
}

module.exports = begin;
