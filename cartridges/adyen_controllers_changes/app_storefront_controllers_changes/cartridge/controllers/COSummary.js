'use strict';

/**
 * This controller implements the last step of the checkout. A successful handling
 * of billing address and payment method selection leads to this controller. It
 * provides the customer with a last overview of the basket prior to confirm the
 * final order creation.
 *
 * @module controllers/COSummary
 */

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');
var Cart = app.getModel('Cart');
// ### Custom Adyen cartridge start ###
var AdyenController = require("int_adyen_controllers/cartridge/controllers/Adyen");
// ### Custom Adyen cartridge end ###

/**
 * Renders the summary page prior to order creation.
 * @param {Object} context context object used for the view
 */
function start(context) {
  var cart = Cart.get();

  // Checks whether all payment methods are still applicable. Recalculates all existing non-gift certificate payment
  // instrument totals according to redeemed gift certificates or additional discounts granted through coupon
  // redemptions on this page.
  var COBilling = app.getController('COBilling');
  if (!COBilling.ValidatePayment(cart)) {
    COBilling.Start();
    return;
  } else {
    Transaction.wrap(function () {
      cart.calculate();
    });
    Transaction.wrap(function () {
      if (!cart.calculatePaymentTransactionTotal()) {
        COBilling.Start();
      }
    });
    var pageMeta = require('~/cartridge/scripts/meta');
    var viewContext = require('app_storefront_core/cartridge/scripts/common/extend').immutable(context, {
      Basket: cart.object
    });
    pageMeta.update({
      pageTitle: Resource.msg('summary.meta.pagetitle', 'checkout', 'SiteGenesis Checkout')
    });
    app.getView(viewContext).render('checkout/summary/summary');
  }
}

/**
 * This function is called when the "Place Order" action is triggered by the
 * customer.
 */
// ### Custom Adyen cartridge start ###
function submit() {
  // Calls the COPlaceOrder controller that does the place order action and any payment authorization.
  // If the order creation failed, it returns a JSON object with an error key and a boolean value.
  var placeOrderResult = app.getController('COPlaceOrder').Start();
  if (Object.keys(placeOrderResult).length === 0 || placeOrderResult.error) {
    start({
      PlaceOrderError: placeOrderResult.PlaceOrderError
    });
  } else {
    if (placeOrderResult.isAdyen || placeOrderResult.continueUrl) {
      const responseUtils = require('*/cartridge/scripts/util/Response');
      responseUtils.renderJSON(placeOrderResult);
    } else {
      showConfirmation(placeOrderResult.Order);
    }
  }
}
// ### Custom Adyen cartridge end ##

/**
 * Renders the order confirmation page after successful order
 * creation. If a nonregistered customer has checked out, the confirmation page
 * provides a "Create Account" form. This function handles the
 * account creation.
 */
// ### Custom Adyen cartridge start ###
function showConfirmation(order) {
  var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  var adyenGivingConfig = AdyenHelper.getAdyenGivingConfig(order);
  if (!customer.authenticated) {
    // Initializes the account creation form for guest checkouts by populating the first and last name with the
    // used billing address.
    var customerForm = app.getForm('profile.customer');
    customerForm.setValue('firstname', order.billingAddress.firstName);
    customerForm.setValue('lastname', order.billingAddress.lastName);
    customerForm.setValue('email', order.customerEmail);
    customerForm.setValue('orderNo', order.orderNo);
  }
  app.getForm('profile.login.passwordconfirm').clear();
  app.getForm('profile.login.password').clear();
  var pageMeta = require('~/cartridge/scripts/meta');
  pageMeta.update({
    pageTitle: Resource.msg('confirmation.meta.pagetitle', 'checkout', 'SiteGenesis Checkout Confirmation')
  });
  app.getView({
    Order: order,
    AdyenGivingConfig: adyenGivingConfig,
    ContinueURL: URLUtils.https('Account-RegistrationForm') // needed by registration form after anonymous checkouts
  }).render('checkout/confirmation/confirmation');
}
// ### Custom Adyen cartridge end ###

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/COSummary~Start */
exports.Start = guard.ensure(['https'], start);
/** @see module:controllers/COSummary~Submit */
exports.Submit = guard.ensure(['https', 'post', 'csrf'], submit);

/*
 * Local method
 */
exports.ShowConfirmation = showConfirmation;