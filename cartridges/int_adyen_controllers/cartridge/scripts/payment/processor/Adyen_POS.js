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
 * Authorizes a payment using a credit card. 
 * The payment is authorized by using the BASIC_CREDIT processor only and setting the order no as the transaction ID. 
 * Customizations may use other processors and custom logic to authorize credit card payment.
 */
function authorize(args) { 
	//todobas Authorise method to Terminal API
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

    if (result.IssuerUrl != '') {
        Transaction.commit();
        session.custom.order = order;
        session.custom.paymentInstrument = paymentInstrument;
        return {
            authorized: true,
            authorized3d: true,
            view: app.getView({
                ContinueURL: URLUtils.https('Adyen-CloseIFrame', 'utm_nooverride', '1'),
                Basket: order,
                issuerUrl: result.IssuerUrl,
                paRequest: result.PaRequest,
                md: result.MD
            })};
    }

    if (result.Decision != 'ACCEPT') {
        Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : '')
        };
    }

    order.custom.Adyen_eventCode = 'AUTHORISATION';
    if ('PspReference' in result && !empty(result.PspReference)) {
        paymentInstrument.paymentTransaction.transactionID = result.PspReference;
        order.custom.Adyen_pspReference = result.PspReference;
    }

    if ('AuthorizationCode' in result && !empty(result.AuthorizationCode)) {
        paymentInstrument.paymentTransaction.custom.authCode = result.AuthorizationCode;
    }

    if ('AdyenAmount' in result && !empty(result.AdyenAmount)) {
        order.custom.Adyen_value = result.AdyenAmount;
    }

    if ('AdyenCardType' in result && !empty(result.AdyenCardType)) {
        order.custom.Adyen_paymentMethod = result.AdyenCardType;
    }
    // Save full response to transaction custom attribute
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(result);
    
    paymentInstrument.paymentTransaction.transactionID = result.PspReference;
    Transaction.commit();

    return {authorized: true};

}

exports.Handle = handle;
exports.Authorize = authorize;
