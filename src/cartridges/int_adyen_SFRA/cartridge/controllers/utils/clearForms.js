const Transaction = require('dw/system/Transaction');
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
  session.privacy.giftCardResponse = null;
  session.privacy.partialPaymentData = null;
  session.privacy.amazonExpressShopperDetail = null;
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
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenPartialPaymentsOrder = null;
    paymentInstrument.custom.adyenMD = null;
    paymentInstrument.custom.adyenAction = null;
  });
}

/**
 * Clear Adyen basket data
 */
function clearAdyenBasketData(basket) {
  if (basket) {
    Transaction.wrap(() => {
      basket.custom.adyenGiftCards = null;
    });
  }
}

/**
 * Clear Adyen transaction data
 */
function clearPaymentTransactionData(paymentInstrument) {
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.custom.Adyen_authResult = null;
    paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = null;
  });
}

module.exports = {
  clearForms,
  clearAdyenData,
  clearPaymentTransactionData,
  clearAdyenBasketData,
};
