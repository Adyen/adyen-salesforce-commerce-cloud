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
	adyenPaymentInstrument = require('int_adyen/cartridge/scripts/createAdyenPaymentInstrument'),
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
 * Authorizes a payment using a credit card. 
 * The payment is authorized by using the BASIC_CREDIT processor only and setting the order no as the transaction ID. 
 * Customizations may use other processors and custom logic to authorize credit card payment.
 */
function authorize(args) { 
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return {authorized: true};
}

exports.Handle = handle;
exports.Authorize = authorize;
