"use strict";

var middlewares = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/index');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  return middlewares.processForm(req, paymentForm, viewFormData);
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
  return middlewares.savePaymentInformation(req, basket, billingData);
}
exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;