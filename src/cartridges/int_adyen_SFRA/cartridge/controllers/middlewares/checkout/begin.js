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
  try {
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
  } catch (error) {
    AdyenLogs.error_log('Failed to restore cart', error);
  }
  return false;
}

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
  }

  const cachedOrderNumber = req.session.privacyCache.get('currentOrderNumber');
  const cachedOrderToken = req.session.privacyCache.get('currentOrderToken');
  if (shouldRestoreBasket(cachedOrderNumber)) {
    if (restoreBasket(cachedOrderNumber, cachedOrderToken)) {
      const emit = (route) => this.emit(route, req, res);
      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
      emit('route:Complete');
      return true;
    }
  }

  const clientKey = AdyenConfigs.getAdyenClientKey();
  const environment = AdyenHelper.getCheckoutEnvironment();
  const installments = AdyenConfigs.getAdyenInstallmentsEnabled()
    ? AdyenConfigs.getCreditCardInstallments()
    : {};
  const adyenClientKey = AdyenConfigs.getAdyenClientKey();
  const googleMerchantID = AdyenConfigs.getGoogleMerchantID();
  const merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  const SFRA6Enabled = AdyenConfigs.getAdyenSFRA6Compatibility();

  const viewData = res.getViewData();
  viewData.adyen = {
    clientKey,
    environment,
    installments,
    googleMerchantID,
    merchantAccount,
    adyenClientKey,
    SFRA6Enabled,
  };

  res.setViewData(viewData);
  return next();
}

module.exports = begin;
