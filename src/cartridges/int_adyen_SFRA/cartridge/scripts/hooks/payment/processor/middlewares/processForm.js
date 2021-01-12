const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const array = require('*/cartridge/scripts/util/array');
const Logger = require('dw/system/Logger');

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

function getPaymentInstrument(req, { storedPaymentUUID }) {
  const { paymentInstruments } = req.currentCustomer.wallet;
  const findById = (item) => storedPaymentUUID === item.UUID;
  return array.find(paymentInstruments, findById);
}

// process payment information
function getProcessFormResult(storedPaymentUUID, req, viewData) {
  // Logger.getLogger('Adyen').error('wallet PIs' + req.currentCustomer.wallet.paymentInstruments);
  // const paymentInstruments = req.currentCustomer.wallet.paymentInstruments;

  // array.find(paymentInstruments, function (item) {
  //   Logger.getLogger('Adyen').error( JSON.stringify(storedPaymentUUID));
  //   Logger.getLogger('Adyen').error( item.UUID);
  //   return viewData.storedPaymentUUID === item.UUID;
  // });

  const { authenticated, registered } = req.currentCustomer.raw;

  if (storedPaymentUUID && authenticated && registered) {
    const paymentInstrument = getPaymentInstrument(req, viewData);

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
          creditCardToken: paymentInstrument.raw.creditCardToken,
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
  storedPaymentUUID,
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
      ...storedPaymentUUID,
    },
    ...storedPaymentUUID,
    saveCard: paymentForm.creditCardFields.saveCard.checked,
  };
}

function getStoredPaymentUUID(paymentForm) {
  const { selectedCardID } = paymentForm.creditCardFields;
  Logger.getLogger('Adyen').error('selectedCardID ' + selectedCardID);
  if(selectedCardID) {
    Logger.getLogger('Adyen').error('paymentForm.creditCardFields.selectedCardID.value ' + paymentForm.creditCardFields.selectedCardID.value);
    return paymentForm.creditCardFields.selectedCardID.value;
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
  const isCreditCard = req.form.brandCode === 'scheme' || brand.indexOf('storedCard') > -1;
  Logger.getLogger('Adyen').error('isCreditCard ' + isCreditCard);
  Logger.getLogger('Adyen').error('brand.indexOf(storedCard) ' + brand.indexOf('storedCard'));
  Logger.getLogger('Adyen').error('req.form.brandCode === scheme ' + req.form.brandCode === 'scheme');
  const creditCardErrors = getCreditCardErrors(req, isCreditCard, paymentForm);

  if (Object.keys(creditCardErrors).length) {
    return {
      fieldErrors: creditCardErrors,
      error: true,
    };
  }

  setSessionPrivacy(paymentForm);
  const { adyenPaymentMethod = null, adyenIssuerName = null } = req.form;
  const storedPaymentUUID = getStoredPaymentUUID(paymentForm);

  const viewData = getViewData(
    viewFormData,
    paymentForm,
    isCreditCard,
    adyenPaymentMethod,
    adyenIssuerName,
    storedPaymentUUID,
  );

  return getProcessFormResult(storedPaymentUUID, req, viewData);
}

module.exports = processForm;
