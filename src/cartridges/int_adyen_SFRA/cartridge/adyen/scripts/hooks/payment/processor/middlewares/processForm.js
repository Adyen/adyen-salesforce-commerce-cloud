const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const array = require('*/cartridge/scripts/util/array');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function getCreditCardErrors(req, isCreditCard, paymentForm) {
  if (!req.form.storedPaymentUUID && isCreditCard) {
    // verify credit card form data
    return COHelpers.validateCreditCard(paymentForm);
  }
  return {};
}

function setSessionPrivacy({ adyenPaymentFields }) {
  session.privacy.adyenFingerprint = adyenPaymentFields.adyenFingerprint.value;
}

function getPaymentInstrument(req, storedPaymentMethodId) {
  const { currentCustomer } = req;

  const findById = (item) =>
    storedPaymentMethodId === item.getCreditCardToken();
  const paymentInstruments = AdyenHelper.getCustomer(currentCustomer)
    .getProfile()
    .getWallet()
    .getPaymentInstruments();
  return array.find(paymentInstruments, findById);
}

// process payment information
function getProcessFormResult(paymentMethod, req, viewData) {
  const { authenticated, registered } = req.currentCustomer.raw;
  if (paymentMethod.storedPaymentMethodId && authenticated && registered) {
    const paymentInstrument = getPaymentInstrument(
      req,
      paymentMethod.storedPaymentMethodId,
    );
    return {
      error: false,
      viewData: {
        ...viewData,
        paymentInformation: {
          ...viewData.paymentInformation,
          cardNumber: paymentInstrument.creditCardNumber,
          cardType: paymentInstrument.creditCardType,
          securityCode: req.form.securityCode,
          expirationMonth: paymentInstrument.creditCardExpirationMonth,
          expirationYear: paymentInstrument.creditCardExpirationYear,
          creditCardToken: paymentInstrument.creditCardToken,
        },
      },
    };
  }

  return {
    error: false,
    viewData,
  };
}

function getViewData(
  viewFormData,
  paymentForm,
  isCreditCard,
  adyenPaymentMethod,
  adyenIssuerName,
) {
  return {
    ...viewFormData,
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value,
    },
    paymentInformation: {
      isCreditCard,
      cardType: paymentForm.creditCardFields.cardType.value,
      cardNumber: paymentForm.creditCardFields.cardNumber.value,
      adyenPaymentMethod,
      adyenIssuerName,
      stateData: paymentForm.adyenPaymentFields.adyenStateData.value,
      partialPaymentsOrder:
        paymentForm.adyenPaymentFields.adyenPartialPaymentsOrder.value,
    },
    saveCard: paymentForm.creditCardFields.saveCard.checked,
  };
}

function getPaymentMethodFromForm(paymentForm) {
  try {
    return JSON.parse(paymentForm.adyenPaymentFields?.adyenStateData?.value)
      .paymentMethod;
  } catch (error) {
    AdyenLogs.error_log('Failed to parse payment form stateData:', error);
    return {};
  }
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  const brand = JSON.stringify(req.form.brandCode);
  const isCreditCard =
    req.form.brandCode === 'scheme' || brand?.indexOf('storedCard') > -1;
  const creditCardErrors = getCreditCardErrors(req, isCreditCard, paymentForm);

  if (Object.keys(creditCardErrors).length) {
    return {
      fieldErrors: creditCardErrors,
      error: true,
    };
  }

  setSessionPrivacy(paymentForm);
  const { adyenPaymentMethod = null, adyenIssuerName = null } = req.form;
  const paymentMethod = getPaymentMethodFromForm(paymentForm);
  const viewData = getViewData(
    viewFormData,
    paymentForm,
    isCreditCard,
    adyenPaymentMethod,
    adyenIssuerName,
  );

  return getProcessFormResult(paymentMethod, req, viewData);
}

module.exports = processForm;
