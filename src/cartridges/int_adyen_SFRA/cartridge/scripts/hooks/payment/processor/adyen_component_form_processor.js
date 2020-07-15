const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  const array = require('*/cartridge/scripts/util/array');
  const viewData = viewFormData;
  let creditCardErrors = {};
  const isCreditCard = req.form.brandCode === 'scheme';
  if (!req.form.storedPaymentUUID && isCreditCard) {
    // verify credit card form data
    creditCardErrors = COHelpers.validateCreditCard(paymentForm);
  }

  if (Object.keys(creditCardErrors).length) {
    return {
      fieldErrors: creditCardErrors,
      error: true,
    };
  }

  session.privacy.adyenFingerprint = paymentForm.adyenPaymentFields.adyenFingerprint.value;

  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value,
  };

  viewData.paymentInformation = {
    isCreditCard: isCreditCard,
    cardType: paymentForm.creditCardFields.cardType.value,
    cardNumber: paymentForm.creditCardFields.cardNumber.value,
    adyenPaymentMethod: req.form.adyenPaymentMethod
      ? req.form.adyenPaymentMethod
      : null,
    adyenIssuerName: req.form.adyenIssuerName ? req.form.adyenIssuerName : null,
    stateData: paymentForm.adyenPaymentFields.adyenStateData.value,
  };

  if (paymentForm.creditCardFields.selectedCardID) {
    viewData.storedPaymentUUID = paymentForm.creditCardFields.selectedCardID.value;
    viewData.paymentInformation.storedPaymentUUID = paymentForm.creditCardFields.selectedCardID.value;
  }

  viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

  // process payment information
  if (
    viewData.storedPaymentUUID
    && req.currentCustomer.raw.authenticated
    && req.currentCustomer.raw.registered
  ) {
    const paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    const paymentInstrument = array.find(paymentInstruments, function (item) {
      return viewData.storedPaymentUUID === item.UUID;
    });

    viewData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
    viewData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
    viewData.paymentInformation.securityCode.value = req.form.securityCode;
    viewData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
    viewData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
    viewData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
  }

  return {
    error: false,
    viewData: viewData,
  };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
  const CustomerMgr = require('dw/customer/CustomerMgr');

  if (
    !billingData.storedPaymentUUID
    && req.currentCustomer.raw.authenticated
    && req.currentCustomer.raw.registered
    && billingData.saveCard
    && billingData.paymentMethod.value === 'CREDIT_CARD'
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

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
