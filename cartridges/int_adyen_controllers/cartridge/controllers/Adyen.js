'use strict';

var Pipeline = require('dw/system/Pipeline');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');

/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify() {
	logger.debug('Calling Adyen.js controller notify action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-Notify');
	logger.debug('After execute pipeline call in Adyen.js controller notify action');
}

/**
 * Redirect to Adyen after saving order etc.
 */
function redirect(order) {
	logger.debug('Calling Adyen.js controller redirect action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-Redirect',{
    	Order : order,
    	PaymentInstrument : order.paymentInstrument
    });
	logger.debug('After execute pipeline call in Adyen.js controller redirect action');
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
	logger.debug('Calling Adyen.js controller showConfirmation action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-ShowConfirmation');
	logger.debug('After execute pipeline call in Adyen.js controller showConfirmation action');
}


/**
 * Make a request to Adyen to get payment methods based on countryCode. Called from COBilling-Start
 */
function getPaymentMethods(cart) {
	logger.debug('Calling Adyen.js controller getPaymentMethods action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-GetPaymentMethods', {Basket: cart.object});
	logger.debug('After execute pipeline call in Adyen.js controller getPaymentMethods action');
}


/**
 * Get orderdata for the Afterpay Payment method
 */
function afterpay() {
	logger.debug('Calling Adyen.js controller afterpay action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-Afterpay');
	logger.debug('After execute pipeline call in Adyen.js controller afterpay action');
}


/**
 * Handle Refused payments
 */
function refusedPayment() {
	logger.debug('Calling Adyen.js controller refusedPayment action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-RefusedPayment');
	logger.debug('After execute pipeline call in Adyen.js controller refusedPayment action');
}


/**
 * Handle payments Cancelled on Adyen HPP
 */
function cancelledPayment() {
	logger.debug('Calling Adyen.js controller cancelledPayment action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-CancelledPayment');
	logger.debug('After execute pipeline call in Adyen.js controller cancelledPayment action');
}


/**
 * Handle payments Pending on Adyen HPP
 */
function pendingPayment() {
	logger.debug('Calling Adyen.js controller pendingPayment action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-PendingPayment');
	logger.debug('After execute pipeline call in Adyen.js controller pendingPayment action');
}


/**
 * Call the Adyen API to capture order payment
 */
function capture() {
	logger.debug('Calling Adyen.js controller capture action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-Capture');
	logger.debug('After execute pipeline call in Adyen.js controller capture action');
}


/**
 * Call the Adyen API to cancel order payment
 */
function cancel() {
	logger.debug('Calling Adyen.js controller cancel action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-Cancel');
	logger.debug('After execute pipeline call in Adyen.js controller cancel action');
}


/**
 * Call the Adyen API to cancel or refund order payment
 */
function cancelOrRefund() {
	logger.debug('Calling Adyen.js controller cancelOrRefund action, execute pipeline call');
    var pdict = Pipeline.execute('Adyen-CancelOrRefund');
	logger.debug('After execute pipeline call in Adyen.js controller cancelOrRefund action');
}


/*
 * Web exposed methods
 */
exports.Notify = guard.ensure(['post'], notify);

exports.Redirect = redirect;

exports.ShowConfirmation = guard.httpsGet(showConfirmation);

exports.GetPaymentMethods = getPaymentMethods;

exports.Afterpay = guard.ensure(['get'], afterpay);

exports.RefusedPayment = refusedPayment;

exports.CancelledPayment = cancelledPayment;

exports.PendingPayment = pendingPayment;

exports.Capture = capture;

exports.Cancel = cancel;

exports.CancelOrRefund = cancelOrRefund;