'use strict';

/* API Includes */
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Pipeline = require('dw/system/Pipeline');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');


/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');

var OrderModel = app.getModel('Order');

/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify() {
    Pipeline.execute('Adyen-Notify');
}

/**
 * Redirect to Adyen after saving order etc.
 */
function redirect(order) {
    var pdict = Pipeline.execute('Adyen-Redirect',{
    	Order : order,
    	PaymentInstrument : order.paymentInstrument
    });
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
    var pdict = Pipeline.execute('Adyen-ShowConfirmation');
	switch (pdict.EndNodeName) {
	case 'showConfirmation':
		app.getController('COSummary').ShowConfirmation(pdict.Order);
	    break;
	case 'error':
		app.getController('Error').Start();
		break;
	case 'summaryStart':
        // A successful billing page will jump to the next checkout step.
        app.getController('COSummary').Start({
            PlaceOrderError: pdict.PlaceOrderError
        });
        break;
	}
}


/**
 * Make a request to Adyen to get payment methods based on countryCode. Called from COBilling-Start
 */
function getPaymentMethods(cart) {
    var pdict = Pipeline.execute('Adyen-GetPaymentMethods', {Basket: cart.object});
    return pdict.AdyenHppPaymentMethods;
}


/**
 * Get orderdata for the Afterpay Payment method
 */
function afterpay() {
	Pipeline.execute('Adyen-Afterpay');
}


/**
 * Handle Refused payments
 */
function refusedPayment() {
    Pipeline.execute('Adyen-RefusedPayment');
}


/**
 * Handle payments Cancelled on Adyen HPP
 */
function cancelledPayment() {
    Pipeline.execute('Adyen-CancelledPayment');
}


/**
 * Handle payments Pending on Adyen HPP
 */
function pendingPayment() {
    Pipeline.execute('Adyen-PendingPayment');
}


/**
 * Call the Adyen API to capture order payment
 */
function capture() {
    Pipeline.execute('Adyen-Capture');
}


/**
 * Call the Adyen API to cancel order payment
 */
function cancel() {
    Pipeline.execute('Adyen-Cancel');
}


/**
 * Call the Adyen API to cancel or refund order payment
 */
function cancelOrRefund() {
    Pipeline.execute('Adyen-CancelOrRefund');
}

/**
 * Make second call to 3d verification system to complete authorization 
 * 
 * @returns redering template or error
 */
function authorizeWithForm()
{
	var order =  session.custom.order;
	var paymentInstrument = session.custom.paymentInstrument;
	var adyenResponse : Object = session.custom.adyenResponse;
	clearCustomSessionFields();
	var pdict = Pipeline.execute('ADYEN_CREDIT-AuthorizeAfterSecure',{
		Order : order,
		PaymentInstrument : paymentInstrument,
		MD : adyenResponse.MD,
		PaRes : adyenResponse.PaRes
		});
	switch (pdict.EndNodeName) {
		case 'authorized':
			OrderModel.submit(order);
			clearForms();
			app.getController('COSummary').ShowConfirmation(order);
			break;
		case 'error':
			Transaction.wrap(function () {
				OrderMgr.failOrder(order);
			});
			app.getController('COSummary').Start({
	            PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
	        });
	}
}

/**
 * Close IFrame where was 3d secure form
 * 
 * @returns template
 */
function closeIFrame() {
	var adyenResponse = {
			MD : request.httpParameterMap.get("MD").stringValue,
			PaRes : request.httpParameterMap.get("PaRes").stringValue
	}
	session.custom.adyenResponse = adyenResponse;
    app.getView({
        ContinueURL: URLUtils.https('Adyen-AuthorizeWithForm')
    }).render('adyenpaymentredirect');
}

/**
 * Clear system session data 
 */
function clearForms() {
    // Clears all forms used in the checkout process.
    session.forms.singleshipping.clearFormElement();
    session.forms.multishipping.clearFormElement();
    session.forms.billing.clearFormElement();
    
    clearCustomSessionFields();
}

/**
 * Clear custom session data 
 */
function clearCustomSessionFields() {
	// Clears all fields used in the 3d secure payment.
    session.custom.adyenResponse = null;
    session.custom.paymentInstrument = null;
    session.custom.order = null;
}

exports.AuthorizeWithForm = guard.ensure(['https', 'post'], authorizeWithForm);

exports.CloseIFrame = guard.ensure(['https', 'post'], closeIFrame);

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