'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

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

    // set selected brandCode & issuerId to session variable
    session.custom.brandCode = req.form.brandCode;
    session.custom.adyenPaymentMethod = req.form.adyenPaymentMethod;
    session.custom.issuerId = req.form.issuerId;
    session.custom.adyenIssuerName = req.form.adyenIssuerName;

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
