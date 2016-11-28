'use strict';

/* API Includes */
var Pipeline = require('dw/system/Pipeline');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');


/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function handle(args) 
{
	var pdict = Pipeline.execute('Adyen-Handle', {Basket : args.Basket});
	switch (pdict.EndNodeName) {
	case 'success':
		return {success : true};
	case 'error':
		return {error : true};
	}
}

/**
 * Authorizes a payment using a credit card. 
 * The payment is authorized by using the BASIC_CREDIT processor only and setting the order no as the transaction ID. 
 * Customizations may use other processors and custom logic to authorize credit card payment.
 */
function authorize(args) { 
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
	var pdict = Pipeline.execute('Adyen-Authorize', {
		OrderNo : orderNo, 
		PaymentInstrument : paymentInstrument});
	switch (pdict.EndNodeName) {
	case 'authorized':
		return {authorized : true};
	case 'error':
		return {error : true};
	}
}

exports.Handle = handle;
exports.Authorize = authorize;
