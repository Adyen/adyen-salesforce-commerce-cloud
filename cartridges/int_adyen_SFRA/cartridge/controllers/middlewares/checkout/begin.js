"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var _require = require('*/cartridge/adyen/scripts/payments/updateSavedCards'),
  updateSavedCards = _require.updateSavedCards;
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function shouldRestoreBasket(cachedOrderNumber) {
  // restore cart if order number was cached
  if (cachedOrderNumber) {
    var currentBasket = BasketMgr.getCurrentBasket();
    // check if cart is null or empty
    if (!currentBasket || currentBasket.getAllProductLineItems().length === 0) {
      return true;
    }
  }
  return false;
}
function restoreBasket(cachedOrderNumber, cachedOrderToken) {
  try {
    var currentOrder = OrderMgr.getOrder(cachedOrderNumber, cachedOrderToken);
    // if order status is CREATED we can fail it and restore basket
    if (currentOrder.status.value === Order.ORDER_STATUS_CREATED) {
      Transaction.wrap(function () {
        currentOrder.trackOrderChange('Failing order so cart can be restored; Shopper navigated back to checkout during payment redirection');
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
  var _this = this;
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw
    });
  }
  var cachedOrderNumber = req.session.privacyCache.get('currentOrderNumber');
  var cachedOrderToken = req.session.privacyCache.get('currentOrderToken');
  if (shouldRestoreBasket(cachedOrderNumber)) {
    if (restoreBasket(cachedOrderNumber, cachedOrderToken)) {
      var emit = function emit(route) {
        return _this.emit(route, req, res);
      };
      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
      emit('route:Complete');
      return true;
    }
  }
  var clientKey = AdyenConfigs.getAdyenClientKey();
  var environment = AdyenHelper.getCheckoutEnvironment();
  var installments = AdyenConfigs.getAdyenInstallmentsEnabled() ? AdyenConfigs.getCreditCardInstallments() : {};
  var adyenClientKey = AdyenConfigs.getAdyenClientKey();
  var googleMerchantID = AdyenConfigs.getGoogleMerchantID();
  var merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  var SFRA6Enabled = AdyenConfigs.getAdyenSFRA6Compatibility();
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    installments: installments,
    googleMerchantID: googleMerchantID,
    merchantAccount: merchantAccount,
    adyenClientKey: adyenClientKey,
    SFRA6Enabled: SFRA6Enabled
  };
  res.setViewData(viewData);
  return next();
}
module.exports = begin;