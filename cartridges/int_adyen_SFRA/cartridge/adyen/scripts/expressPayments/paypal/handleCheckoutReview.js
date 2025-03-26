"use strict";

var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');
var Transaction = require('dw/system/Transaction');
var AccountModel = require('*/cartridge/models/account');
var OrderModel = require('*/cartridge/models/order');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

/**
 * Sets Shipping and Billing address for the basket,
 * also updated payment method on the paymentInstrument of Basket.
 * @param {dw.order.Basket} currentBasket - the current basket
 * @param {sfra.Request} req - request object
 * @returns {undefined}
 */
function updateCurrentBasket(currentBasket, req) {
  var _currentBasket$shipme;
  var _JSON$parse = JSON.parse(req.form.data),
    details = _JSON$parse.details;
  if (((_currentBasket$shipme = currentBasket.shipments) === null || _currentBasket$shipme === void 0 ? void 0 : _currentBasket$shipme.length) <= 1) {
    req.session.privacyCache.set('usingMultiShipping', false);
  }
  var paymentInstrument = currentBasket.getPaymentInstruments()[0];
  Transaction.wrap(function () {
    paymentInstrument.custom.adyenPaymentMethod = AdyenHelper.getAdyenComponentType(details === null || details === void 0 ? void 0 : details.paymentSource);
  });
}

/**
 * Controller for the checkout review page for express payment methods
 * @param {sfra.Request} req - request
 * @param {sfra.Response} res - response
 * @param {sfra.Next} next - next
 * @returns {sfra.Next} next - next
 */
function handleCheckoutReview(req, res, next) {
  try {
    if (!req.form.data) {
      throw new Error('State data not present in the request');
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }
    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }
    updateCurrentBasket(currentBasket, req);
    var currentCustomer = req.currentCustomer.raw;
    var currentLocale = Locale.getLocale(req.locale.id);
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var orderModel = new OrderModel(currentBasket, {
      customer: currentCustomer,
      usingMultiShipping: usingMultiShipping,
      shippable: true,
      countryCode: currentLocale.country,
      containerView: 'basket'
    });
    var accountModel = new AccountModel(req.currentCustomer);
    res.render('cart/checkoutReview', {
      data: req.form.data,
      showConfirmationUrl: URLUtils.https('Adyen-ShowConfirmationPaymentFromComponent'),
      order: orderModel,
      customer: accountModel
    });
  } catch (error) {
    AdyenLogs.error_log('Could not render checkout review page', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
  return next();
}
module.exports = handleCheckoutReview;