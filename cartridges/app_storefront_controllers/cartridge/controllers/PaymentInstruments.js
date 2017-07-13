'use strict';

/**
 * Controller that displays credit card and other payment information and
 * lets the user change it.
 *
 * @module controllers/PaymentInstruments
 */

/* API includes */
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');


/**
 * Displays a list of customer payment instruments.
 *
 * Gets customer payment instrument information. Clears the paymentinstruments form and adds the customer
 * payment information to it. Updates the page metadata.
 * Renders a list of the saved credit card payment instruments of the current
 * customer (account/payment/paymentinstrumentlist template).
 */
function list() {
    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
    var pageMeta = require('~/cartridge/scripts/meta');
    var AdyenHelper = require('int_adyen/cartridge/scripts/util/AdyenHelper');
    var paymentForm = app.getForm('paymentinstruments');

    paymentForm.clear();
    paymentForm.get('creditcards.storedcards').copyFrom(paymentInstruments);

    pageMeta.update(dw.content.ContentMgr.getContent('myaccount-paymentsettings'));

    app.getView({
        PaymentInstruments: paymentInstruments
    }).render('account/payment/paymentinstrumentlist');
}


/**
 * Adds a new credit card payment instrument to the saved payment instruments of the current customer.
 * Sets the ContinueURL to PaymentInstruments-PaymentForm and renders the payment instrument details page
 * (account/payment/paymentinstrumentdetails template).
 * __Note:__this function is called by the {@link module:controllers/PaymentInstruments~handlePaymentForm|handlePaymentForm} function.
 * @param {boolean} clearForm true or missing clears the form before displaying the page, false skips it
 */
function add(clearForm) {
    var paymentForm = app.getForm('paymentinstruments');
    var errorMessage = '';

    if (clearForm === false) {
    	errorMessage = Resource.msg('account.paymentinstrumentdetails.addcard.error', 'account', null);
    } else {
        paymentForm.clear();
    }
    paymentForm.get('creditcards.newcreditcard.type').setOptions(dw.order.PaymentMgr.getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).activePaymentCards.iterator());

    pageMeta.update(dw.content.ContentMgr.getContent('myaccount-paymentsettings'));

    app.getView({
    	ContinueURL: URLUtils.https('PaymentInstruments-PaymentForm'),
    	ErrorMessage: errorMessage
    }).render('account/payment/paymentinstrumentdetails');
}

/**
 * Form handler for the paymentinstruments form. Handles the following actions:
 * - __create__ - calls the {@link module:controllers/PaymentInstruments~create|create} function to create a payment instrument
 * and redirects to {@link module:controllers/PaymentInstruments~list|list}. If the
 * creation fails, calls the {@link module:controllers/PaymentInstruments~add|add} function with a clearform value of false.
 * - __error__ - calls the {@link module:controllers/PaymentInstruments~add|add} function with a clearform value of false.
 */
function handlePaymentForm() {
    var paymentForm = app.getForm('paymentinstruments');
    paymentForm.handleAction({
        create: function () {
            if (!create()) {
                add(false);
                return;
            } else {
                response.redirect(URLUtils.https('PaymentInstruments-List'));
            }
        },
        cancel: function () {
        	response.redirect(URLUtils.https('PaymentInstruments-List'));
        },
        error: function () {
            add(false);
        }
    });
}

/**
 * Creates a new payment instrument. Verifies the credit card and checks if it is a duplicate of
 * a card already in the current customer's payment instruments. In a transaction, the function
 * attempts to save the credit card to the customer's payment instruments. If a duplicate card was
 * detected, the original card is removed after the new card is created. If the card cannot be created
 * successfully, the transaction is rolled back. Whether successful or not, the paymentinstruments
 * form is cleared.
 *
 * @transaction
 * @return {boolean} true if the credit card can be verified, false otherwise
 */
function create() {
    if (!verifyCreditCard()) {
        return false;
    }
    var i, tokenID, pspReference;

    if (AdyenHelper.getAdyenRecurringPaymentsEnabled()) {
    	var createRecurringPaymentAccountResult = AdyenHelper.createRecurringPaymentAccount({
    	Customer: customer
    });

	if (createRecurringPaymentAccountResult.error) {
		 return false;
	}

	pspReference = 'PspReference' in createRecurringPaymentAccountResult && !empty(createRecurringPaymentAccountResult.PspReference) ? createRecurringPaymentAccountResult.PspReference : '';
	tokenID = 'TokenID' in createRecurringPaymentAccountResult && !empty(createRecurringPaymentAccountResult.TokenID) ? createRecurringPaymentAccountResult.TokenID : '';

	var paymentForm = app.getForm('paymentinstruments');
	var creditCardForm = paymentForm.get('creditcards.newcreditcard');
	var creditCards = customer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
	 
    try {
    	Transaction.wrap(function () {
    		var newCreditCard = customer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
    		
    		// copy the credit card details to the payment instrument
    		newCreditCard.setCreditCardHolder(creditCardForm.object.owner.value);
    		newCreditCard.setCreditCardNumber(creditCardForm.object.number.value);
    		newCreditCard.setCreditCardExpirationMonth(creditCardForm.object.expiration.month.value);
    		newCreditCard.setCreditCardExpirationYear(creditCardForm.object.expiration.year.value);
    		newCreditCard.setCreditCardType(creditCardForm.object.type.value);
    		
    		if (!empty(tokenID)) {
    			newCreditCard.setCreditCardToken(tokenID);
    		}
    		
    		if (!empty(pspReference)) {
    			newCreditCard.custom.AdyenPspReference = pspReference;
    		}
    		
    		for (i = 0; i < creditCards.length; i++) {
    			var creditcard = creditCards[i];
    			if (creditcard.maskedCreditCardNumber === newCreditCard.maskedCreditCardNumber && creditcard.creditCardType === newCreditCard.creditCardType) {
    				removeCreditCard(newCreditCard, creditcard);
    			} else if (creditcard.creditCardToken === newCreditCard.creditCardToken) {
    				removeCreditCard(newCreditCard, creditcard);
    			}
    		}
        });
    } catch (ex) {
        return false;
    }

    paymentForm.clear();

    return true;
}

function removeCreditCard(newCreditCard, creditcard) {
	// make sure the token is carried over to the new card if token doesn't exist on new card
    if (empty(newCreditCard.creditCardToken) && !empty(creditcard.creditCardToken)) {
    	newCreditCard.setCreditCardToken(creditcard.creditCardToken);
    }

    // make sure firstPspReference is carried over to the new card if PspReference doesn't exist on new card
    var newCardPsp = 'AdyenPspReference' in newCreditCard.custom && !empty(newCreditCard.custom.AdyenPspReference) ? newCreditCard.custom.AdyenPspReference : '';
    var creditCardPsp = 'AdyenPspReference' in creditcard.custom && !empty(creditcard.custom.AdyenPspReference) ? creditcard.custom.AdyenPspReference : '';
	if (empty(newCardPsp) && !empty(creditCardPsp)) {
		newCreditCard.custom.AdyenPspReference = creditCardPsp;
	}

	// now remove the old payment instrument
	customer.getProfile().getWallet().removePaymentInstrument(creditcard);
}

/**
 * Form handler for the paymentinstruments form. Handles the following actions:
 * - __remove__ - uses the form and action supplied by the FormModel to remove a customer payment instrument
 * in a transaction.
 * - __error__ - does nothing.
 *
 * In either case, redirects to the {@link module:controllers/PaymentInstruments~list|List} function.
 * @transaction
 * @TODO Should be moved into handlePaymentForm
 * @FIXME Inner method should be lowercase.error action should do something
 */
function Delete() {
    var paymentForm = app.getForm('paymentinstruments');
    paymentForm.handleAction({
        remove: function (formGroup, action) {
            Transaction.wrap(function () {
                var wallet = customer.getProfile().getWallet();
                var paymentInstrument = action.object;
                
               	if (!empty(paymentInstrument)) {
               		if (AdyenHelper.getAdyenRecurringPaymentsEnabled() && !empty(paymentInstrument.getCreditCardToken())) {
               			var result = require('int_adyen/cartridge/scripts/adyenDeleteRecurringPayment.js').deleteRecurringPayment({
               				Customer: customer,
               				RecurringDetailReference: paymentInstrument.getCreditCardToken()
               			});
               			
               			if (result == PIPELET_NEXT) {
               					wallet.removePaymentInstrument(paymentInstrument);
               			}
               		} else {
               			wallet.removePaymentInstrument(paymentInstrument);
               		}
               	}
            });

        },
        error: function () {
            // @TODO When could this happen
        }
    });

    response.redirect(URLUtils.https('PaymentInstruments-List'));
}


/*
 * Private helpers
 */

/**
 * Verifies if the entered credit card details are valid.
 *
 * @returns {boolean} true in case of success, otherwise false.
 */
function verifyCreditCard() {
	 if (AdyenHelper.getAdyenCseEnabled()) {
		 return true;
	}
	 
	var newCreditCardForm = app.getForm('paymentinstruments.creditcards.newcreditcard');
    var expirationMonth = newCreditCardForm.get('expiration.month').value();
    var expirationYear = newCreditCardForm.get('expiration.year').value();
    var cardNumber = newCreditCardForm.get('number').value();
    var paymentCard = PaymentMgr.getPaymentCard(newCreditCardForm.get('type').value());
    var verifyPaymentCardResult = paymentCard.verify(expirationMonth, expirationYear, cardNumber);

    if (verifyPaymentCardResult.error === true) {

        if (!newCreditCardForm.isValid()) {
            return false;
        }

        if (verifyPaymentCardResult.code === Status.OK) {
            return true;
        }

        // Invalidate the payment card form elements.
        for (var i = 0; i < verifyPaymentCardResult.items.length; i++) {
            if (verifyPaymentCardResult.items[i].code === PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER) {
                newCreditCardForm.get('number').invalidate();
            } else if (verifyPaymentCardResult.items[i].code === PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE) {
                newCreditCardForm.get('expiration.month').invalidate();
                newCreditCardForm.get('expiration.year').invalidate();
            }
        }
        return false;
    }

    return true;
}

/*
 * Web exposed methods
 */
/** Renders a list of the saved credit card payment instruments of the current customer.
 * @see module:controllers/PaymentInstruments~list */
exports.List = guard.ensure(['https', 'get', 'loggedIn'], list);
/** Adds a new credit card payment instrument to the saved payment instruments of the current customer.
 * @see module:controllers/PaymentInstruments~add */
exports.Add = guard.ensure(['https', 'get', 'loggedIn'], add);
/** Handles the submitted form for creating payment instruments.
 * @see module:controllers/PaymentInstruments~handlePaymentForm */
exports.PaymentForm = guard.ensure(['https', 'post', 'loggedIn', 'csrf'], handlePaymentForm);
/** Deletes a saved credit card payment instrument.
 * @see module:controllers/PaymentInstruments~Delete */
exports.Delete = guard.ensure(['https', 'loggedIn'], Delete);
