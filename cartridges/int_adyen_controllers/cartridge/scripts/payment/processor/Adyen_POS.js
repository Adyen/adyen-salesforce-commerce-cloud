'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function handle(args) {
	var	adyenRemovePreviousPI = require('int_adyen/cartridge/scripts/adyenRemovePreviousPI'),
	adyenPaymentInstrument = require('int_adyen/cartridge/scripts/createAdyenPOSPaymentInstrument'),
	result;
	
    Transaction.wrap(function () {
    	result = adyenRemovePreviousPI.removePaymentInstruments(args.Basket);
        if (result === PIPELET_ERROR) {
    		return {error : true};
    	}
        // payment instrument returned on success
        result = adyenPaymentInstrument.create(args.Basket);
    });
    
    if (result === PIPELET_ERROR) {
		return {error : true};
	}

	return {success : true};
}

/**
 * Authorizes a payment using a POS terminal. 
 * The payment is authorized by using the Adyen_POS processor only and setting the order no as the transaction ID. 
 */
function authorize(args) { 
	var AdyenHelper = require('int_adyen/cartridge/scripts/util/AdyenHelper');
	
	var order = args.Order;
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    // ScriptFile	adyenPosVerification.ds
    var adyenPosVerification = require('int_adyen/cartridge/scripts/adyenPosVerification');
    Transaction.begin();
    var result = adyenPosVerification.verify({
        Order: order,
        Amount: paymentInstrument.paymentTransaction.amount,
        CurrentSession: session,
        CurrentRequest: request,
        PaymentInstrument: paymentInstrument
    });

    if (result.error) {
        Transaction.rollback();
        let args = 'args' in result ? result.args : null;

        return {
            error: true,
            PlaceOrderError: (!empty(args) && 'AdyenErrorMessage' in args && !empty(args.AdyenErrorMessage) ? args.AdyenErrorMessage : '')
        };
    }

    if(result['Response'].SaleToPOIResponse.PaymentResponse){
	    var paymentResponse = result['Response'].SaleToPOIResponse.PaymentResponse;
	    if (paymentResponse.Response.Result == 'Success') {
	    	order.custom.Adyen_eventCode = 'AUTHORISATION';
	    	if (!empty(paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID)) {
	        	var pspReference = paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID;
	        	paymentInstrument.paymentTransaction.transactionID = pspReference;
	        	order.custom.Adyen_pspReference = pspReference;
	        }
	    	// Save full response to transaction custom attribute
	        paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(paymentResponse); 
	    	Transaction.commit();
	    	return {authorized: true};
	    } 
	    else {
	    	Transaction.rollback();
	        return {
	            error: true,
	            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : '')
	        };
	    }
    }
    else {
    	Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : '')
        };
    }
}

exports.Handle = handle;
exports.Authorize = authorize;
