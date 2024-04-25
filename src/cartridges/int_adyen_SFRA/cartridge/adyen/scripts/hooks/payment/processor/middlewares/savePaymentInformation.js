const CustomerMgr = require('dw/customer/CustomerMgr');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

function hasValidBillingData({ storedPaymentUUID, saveCard, paymentMethod }) {
  const isCreditCard = paymentMethod.value === 'CREDIT_CARD';
  return !storedPaymentUUID && saveCard && isCreditCard;
}

function isValidCustomer({ authenticated, registered }) {
  return authenticated && registered;
}

function isValid(raw, billingData) {
  return isValidCustomer(raw) && hasValidBillingData(billingData);
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
  const { raw, profile, wallet } = req.currentCustomer;
  if (isValid(raw, billingData)) {
    const customer = CustomerMgr.getCustomerByCustomerNumber(
      profile.customerNo,
    );

    const saveCardResult = COHelpers.savePaymentInstrumentToWallet(
      billingData,
      basket,
      customer,
    );

    wallet.paymentInstruments.push({
      creditCardHolder: saveCardResult.creditCardHolder,
      maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
      creditCardType: saveCardResult.creditCardType,
      creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
      creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
      UUID: saveCardResult.UUID,
      ...('creditCardNumber' in saveCardResult && {
        creditCardNumber: saveCardResult.creditCardNumber,
      }),
      raw: saveCardResult,
    });
  }
}

module.exports = savePaymentInformation;
