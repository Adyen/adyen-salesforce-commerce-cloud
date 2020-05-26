'use strict';

var server = require('server');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        stateData: paymentForm.adyenPaymentFields.adyenStateData.value
    };

    if (typeof req.form.adyenPaymentMethod !== "undefined") {
        viewData.paymentInformation.adyenPaymentMethod = req.form.adyenPaymentMethod;
    } else {
        viewData.paymentInformation.adyenPaymentMethod = null;
    }
    if (typeof req.form.adyenIssuerName !== "undefined") {
        viewData.paymentInformation.adyenIssuerName = req.form.adyenIssuerName;
    } else {
        viewData.paymentInformation.adyenIssuerName = null;
    }

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {

}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
