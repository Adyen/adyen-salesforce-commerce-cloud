const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
  const CustomerMgr = require('dw/customer/CustomerMgr');

  if (
    !billingData.storedPaymentUUID &&
    req.currentCustomer.raw.authenticated &&
    req.currentCustomer.raw.registered &&
    billingData.saveCard &&
    billingData.paymentMethod.value === 'CREDIT_CARD'
  ) {
    const customer = CustomerMgr.getCustomerByCustomerNumber(
      req.currentCustomer.profile.customerNo,
    );

    const saveCardResult = COHelpers.savePaymentInstrumentToWallet(
      billingData,
      basket,
      customer,
    );

    req.currentCustomer.wallet.paymentInstruments.push({
      creditCardHolder: saveCardResult.creditCardHolder,
      maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
      creditCardType: saveCardResult.creditCardType,
      creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
      creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
      UUID: saveCardResult.UUID,
      creditCardNumber: Object.hasOwnProperty.call(
        saveCardResult,
        'creditCardNumber',
      )
        ? saveCardResult.creditCardNumber
        : null,
      raw: saveCardResult,
    });
  }
}

module.exports = savePaymentInformation;
