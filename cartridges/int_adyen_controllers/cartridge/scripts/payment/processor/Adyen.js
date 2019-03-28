'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function handle(args) {
	var	adyenRemovePreviousPI = require('int_adyen_overlay/cartridge/scripts/adyenRemovePreviousPI'),
	adyenPaymentInstrument = require('int_adyen_overlay/cartridge/scripts/createAdyenPaymentInstrument'),
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

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNo);
    
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    
    var	adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout'),
	result;

	Transaction.wrap(function () {
		result = adyenCheckout.alternativePaymentMethod({
			'Order': order,
			'Amount': order.paymentInstrument.paymentTransaction.amount,
			'OrderNo': order.orderNo,
			'CurrentSession' : session,
			'CurrentUser' : customer,
			'PaymentInstrument' : order.paymentInstrument,
			'PaymentType': session.custom.brandCode,
			'Issuer' : session.custom.issuer,
			'dob' : session.forms.adyPaydata.dob.value,
			'gender' : session.forms.adyPaydata.gender.value,
			'houseNumber' : session.forms.adyPaydata.houseNumber.value,
			'houseExtension' : session.forms.adyPaydata.houseExtension.value,
			'socialSecurityNumber' : session.forms.adyPaydata.socialSecurityNumber.value,
			'ratePayFingerprint' : session.custom.ratePayFingerprint,
			'adyenFingerprint' : session.forms.adyPaydata.adyenFingerprint.value
		});
	});
	
	 if (result.error) {
	        var errors = [];
	        errors.push(result.args.AdyenErrorMessage);
	        return {
	            authorized: false, fieldErrors: [], serverErrors: errors, error: true
	        };
	    }

	    if (result.ResultCode == 'RedirectShopper') {
	        return {
	            authorized: true,
	            order: order,
	            paymentInstrument: paymentInstrument,
	            redirectObject : result.RedirectObject
	        };
	    }
	    else if(result.ResultCode == 'Authorised' || result.ResultCode == 'Received'){
	        return { authorized: true, error: false };
	    }
	    else {
	        Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
	        return {
	            authorized: false, error: true
	        };
	    }
}

exports.Handle = handle;
exports.Authorize = authorize;
