"use strict";

var Transaction = require('dw/system/Transaction');
/**
 * Clear custom session data
 */


function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.privacy.paymentMethod = null;
  session.privacy.orderNo = null;
  session.privacy.brandCode = null;
  session.privacy.issuer = null;
  session.privacy.adyenPaymentMethod = null;
  session.privacy.adyenIssuerName = null;
  session.privacy.ratePayFingerprint = null;
}
/**
 * Clear system session data
 */


function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.billing.clearFormElement();
  clearCustomSessionFields();
}
/**
 * Clear Adyen payment data
 */


function clearAdyenData(paymentInstrument) {
  Transaction.wrap(function () {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenMD = null;
    paymentInstrument.custom.adyenAction = null;
  });
}

module.exports = {
  clearForms: clearForms,
  clearAdyenData: clearAdyenData
};