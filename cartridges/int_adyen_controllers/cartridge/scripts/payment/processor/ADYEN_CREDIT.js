'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require(Resource.msg('scripts.app.js', 'require', null));
var Cart = require(Resource.msg('script.models.cartmodel', 'require', null));

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);
    var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var adyenRemovePreviousPI = require('int_adyen_overlay/cartridge/scripts/adyenRemovePreviousPI');
    var result;

    Transaction.wrap(function () {
        result = adyenRemovePreviousPI.removePaymentInstruments(args.Basket);
    });

    if (result === PIPELET_ERROR) {
        return {error: true};
    }
    var creditCardForm = app.getForm('billing.paymentMethods.creditCard');
    var tokenID = AdyenHelper.getCardToken(creditCardForm.get('selectedCardID').value(), customer);
    var cardType = creditCardForm.get('type').value();
    var encryptedData = creditCardForm.get('encrypteddata').value();
    var paymentCard = PaymentMgr.getPaymentCard(cardType);
    var cardNumber;
    var cardSecurityCode;
    var expirationMonth; 
    var expirationYear;
    var adyenCseEnabled = Site.getCurrent().getCustomPreferenceValue('AdyenCseEnabled');
    if (empty(tokenID) && (!adyenCseEnabled || empty(encryptedData))) {
        // Verify payment card 
	      cardSecurityCode = creditCardForm.get('cvn').value();
	      expirationMonth = creditCardForm.get('expiration.month').value();
	      expirationYear = creditCardForm.get('expiration.year').value();
	      cardNumber = creditCardForm.get('number').value();
	      var creditCardStatus = paymentCard.verify(expirationMonth, expirationYear, cardNumber, cardSecurityCode);
        if (creditCardStatus.error) {
            var invalidatePaymentCardFormElements = require(Resource.msg('scripts.checkout.invalidatepaymentcardformelements.js', 'require', null));
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
        } else {
            paymentInstrument.creditCardType = cardType;
        }

        if (!empty(tokenID)) {
            paymentInstrument.setCreditCardToken(tokenID);
        }
    });

    return {success: true};
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
    var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');

    // TODO: check is that one needed
    if (args.RequestID) {
        return {authorized: true};
    }

    var order = args.Order;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    // ScriptFile	adyenCreditVerification.ds
    var adyenCreditVerification = require('int_adyen_overlay/cartridge/scripts/adyenCreditVerification');
    Transaction.begin();
    var result = adyenCreditVerification.verify({
        Order: order,
        Amount: paymentInstrument.paymentTransaction.amount,
        CurrentSession: session,
        CurrentRequest: request,
        PaymentInstrument: paymentInstrument,
        CreditCardForm: app.getForm('billing.paymentMethods.creditCard'),
        SaveCreditCard: customer.authenticated && app.getForm('billing').object.paymentMethods.creditCard.saveCard.value
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
        session.custom.orderNo = order.orderNo;
        session.custom.paymentMethod = paymentInstrument.paymentMethod;
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

exports.Handle = Handle;
exports.Authorize = Authorize;