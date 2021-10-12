"use strict";

var shippingHelpers = require('base/checkout/shipping');

var billingHelpers = require('base/checkout/billing');

var summaryHelpers = require('base/checkout/summary');

var billing = require('./billing');

var adyenCheckout = require('../adyenCheckout');

module.exports.updateCheckoutView = function updateCheckoutView() {
  $('body').on('checkout:updateCheckoutView', function (e, data) {
    shippingHelpers.methods.updateMultiShipInformation(data.order);
    summaryHelpers.updateTotals(data.order.totals);
    data.order.shipping.forEach(function (shipping) {
      shippingHelpers.methods.updateShippingInformation(shipping, data.order, data.customer, data.options);
    });
    var currentStage = window.location.search.substring(window.location.search.indexOf('=') + 1);

    if (currentStage === ('shipping' || 'payment')) {
      adyenCheckout.methods.renderGenericComponent();
    }

    billingHelpers.methods.updateBillingInformation(data.order, data.customer, data.options);
    billing.methods.updatePaymentInformation(data.order, data.options);
    summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
  });
};