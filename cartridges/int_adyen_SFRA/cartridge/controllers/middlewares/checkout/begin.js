"use strict";

var BasketMgr = require('dw/order/BasketMgr');

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

var Order = require('dw/order/Order');

var Transaction = require('dw/system/Transaction');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var URLUtils = require('dw/web/URLUtils');

var _require = require('*/cartridge/scripts/updateSavedCards'),
    updateSavedCards = _require.updateSavedCards;

function begin(req, res, next) {
  var _this = this;

  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw
    });
  } // restore cart if order number was cached


  try {
    var cachedOrderNumber = req.session.privacyCache.get('currentOrderNumber');

    if (cachedOrderNumber !== null) {
      var currentBasket = BasketMgr.getCurrentBasket();
      var currentOrder = OrderMgr.getOrder(cachedOrderNumber); // if current basket is null or empty

      if (!currentBasket || currentBasket.getAllProductLineItems().length === 0) {
        // if order status is CREATED we can fail it and restore basket
        if ((currentOrder === null || currentOrder === void 0 ? void 0 : currentOrder.status.value) === Order.ORDER_STATUS_CREATED) {
          Transaction.wrap(function () {
            currentOrder.trackOrderChange('Failing order so cart can be restored; Shopper navigated back to checkout during payment redirection');
            OrderMgr.failOrder(currentOrder, true);
          });

          var emit = function emit(route) {
            return _this.emit(route, req, res);
          };

          res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
          emit('route:Complete');
          return true;
        }
      }
    }
  } catch (error) {
    Logger.getLogger('Adyen').error("Failed to restore cart. error: ".concat(error));
  }

  var clientKey = AdyenHelper.getAdyenClientKey();
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var installments = AdyenHelper.getCreditCardInstallments();
  var adyenClientKey = AdyenHelper.getAdyenClientKey();
  var googleMerchantID = AdyenHelper.getGoogleMerchantID();
  var merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  var cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  var paypalIntent = AdyenHelper.getAdyenPayPalIntent();
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    installments: installments,
    googleMerchantID: googleMerchantID,
    merchantAccount: merchantAccount,
    cardholderNameBool: cardholderNameBool,
    paypalIntent: paypalIntent,
    adyenClientKey: adyenClientKey
  };
  res.setViewData(viewData);
  next();
}

module.exports = begin;