'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var Cart = require('app_storefront_controllers/cartridge/scripts/models/CartModel');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
	var cart = Cart.get(args.Basket);
    var	adyenRemovePreviousPI = require('int_adyen/cartridge/scripts/adyenRemovePreviousPI'), result;
	
    Transaction.wrap(function () {
    	result = adyenRemovePreviousPI.removePaymentInstruments(args.Basket);
    });
    
    if (result === PIPELET_ERROR) {
		return {error : true};
	}
    
    var adyenCseEnabled = Site.getCurrent().getCustomPreferenceValue('AdyenCseEnabled');
    if (!adyenCseEnabled) {
    	// Verify payment card
        var creditCardForm = app.getForm('billing.paymentMethods.creditCard');
        var cardNumber = creditCardForm.get('number').value();
        var cardSecurityCode = creditCardForm.get('cvn').value();
        var cardType = creditCardForm.get('type').value();
        var expirationMonth = creditCardForm.get('expiration.month').value();
        var expirationYear = creditCardForm.get('expiration.year').value();
        var paymentCard = PaymentMgr.getPaymentCard(cardType);

        var creditCardStatus = paymentCard.verify(expirationMonth, expirationYear, cardNumber, cardSecurityCode);
        if (creditCardStatus.error) {
            var invalidatePaymentCardFormElements = require('app_storefront_core/cartridge/scripts/checkout/InvalidatePaymentCardFormElements');
            // original second parameter was: session.forms.billing.paymentMethods.creditCard
            invalidatePaymentCardFormElements.invalidatePaymentCardForm(creditCardStatus, creditCardForm);

            return {error: true};
        }
    }
    
    // create payment instrument
    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        var paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());
        if (!adyenCseEnabled) {
            paymentInstrument.creditCardHolder = creditCardForm.get('owner').value();
            paymentInstrument.creditCardNumber = cardNumber;
            paymentInstrument.creditCardType = cardType;
            paymentInstrument.creditCardExpirationMonth = expirationMonth;
            paymentInstrument.creditCardExpirationYear = expirationYear;
        }
    });

	return {success : true};
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
	// TODO: check is that one needed
	if (args.RequestID) {
		return {authorized : true};
	}
	
	var order = args.Order;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
    	paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    
    // ScriptFile	adyenCreditVerification.ds
	var	adyenCreditVerification = require('int_adyen/cartridge/scripts/adyenCreditVerification');
	Transaction.begin();
	var result = adyenCreditVerification.verify({
		Order: order,
		Amount: paymentInstrument.paymentTransaction.amount,
		CurrentSession: session,
		CurrentRequest: request,
		PaymentInstrument: paymentInstrument,
		CreditCardForm: app.getForm('billing.paymentMethods.creditCard')
	});
	
    if (result === PIPELET_ERROR) {
    	Transaction.rollback();
		return {error : true};
	}
    
    if (result.IssuerUrl != '' ) {
    	Transaction.commit();
        
    	session.custom.order = order;
    	session.custom.paymentInstrument = paymentInstrument;
    	return {
    		authorized : true,
    		authorized3d : true,
    		view : app.getView({
    			ContinueURL: URLUtils.https('Adyen-CloseIFrame', 'utm_nooverride', '1'),
    			Basket : order,
    	    	issuerUrl : result.IssuerUrl,
    	    	paRequest: result.PaRequest,
    	    	md : result.MD
    	 })};
    }
    
    if (result.Decision != 'ACCEPT') {
    	Transaction.rollback();
		return {error : true};
    }
    
    paymentInstrument.paymentTransaction.transactionID = result.PspReference;
    Transaction.commit();
    
	return {authorized : true};
}

exports.Handle = Handle;
exports.Authorize = Authorize;
