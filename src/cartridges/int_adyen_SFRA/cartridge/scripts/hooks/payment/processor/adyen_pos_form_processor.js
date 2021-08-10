/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  const viewData = viewFormData;
  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value,
  };

  return {
    error: false,
    viewData,
  };
}

/**
 * By default no save payment information is supported
 */
function savePaymentInformation() {}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
