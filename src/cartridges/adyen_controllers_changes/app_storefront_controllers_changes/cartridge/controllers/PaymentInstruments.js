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
var constants = require("*/cartridge/adyenConstants/constants");
// ### Custom Adyen cartridge start ###
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('int_adyen_overlay/cartridge/scripts/util/adyenConfigs');
var adyenSessions = require('int_adyen_overlay/cartridge/scripts/adyenSessions');
var adyenSaveCreditCard = require("*/cartridge/scripts/adyenSaveCreditCard");
var AdyenLogs = require("int_adyen_overlay/cartridge/scripts/adyenCustomLogs")
// ### Custom Adyen cartridge end ###

/**
 * Displays a list of customer payment instruments.
 *
 * Gets customer payment instrument information. Clears the paymentinstruments form and adds the customer
 * payment information to it. Updates the page metadata.
 * Renders a list of the saved credit card payment instruments of the current
 * customer (account/payment/paymentinstrumentlist template).
 */
// ### Custom Adyen cartridge start ###
function list() {
    // Get the Saved Cards from Adyen to get latest saved cards
    require('int_adyen_overlay/cartridge/scripts/updateSavedCards').updateSavedCards({CurrentCustomer : customer});

    var paymentInstruments = getAdyenPaymentInstruments();
    var pageMeta = require('~/cartridge/scripts/meta');
    var paymentForm = app.getForm('paymentinstruments');

    paymentForm.clear();
    paymentForm.get('creditcards.storedcards').copyFrom(paymentInstruments);

    pageMeta.update(dw.content.ContentMgr.getContent('myaccount-paymentsettings'));

    app.getView({
        PaymentInstruments: paymentInstruments
    }).render('account/payment/paymentinstrumentlist');
}
// ### Custom Adyen cartridge end ##

// ### Custom Adyen cartridge start ##
function getSessionData() {

  var sessionsResponse =  adyenSessions.createSession(
    null,
    customer,
    '',
  );

  return {
    id: sessionsResponse.id,
    sessionData: sessionsResponse.sessionData,
  };
}
// ### Custom Adyen cartridge end ##

/**
 * Adds a new credit card payment instrument to the saved payment instruments of the current customer.
 * Sets the ContinueURL to PaymentInstruments-PaymentForm and renders the payment instrument details page
 * (account/payment/paymentinstrumentdetails template).
 * __Note:__this function is called by the {@link module:controllers/PaymentInstruments~handlePaymentForm|handlePaymentForm} function.
 * @param {boolean} clearForm true or missing clears the form before displaying the page, false skips it
 */
function add(clearForm) {
    var paymentForm = app.getForm('paymentinstruments');
    if (clearForm !== false) {
        paymentForm.clear();
    }
    paymentForm.get('creditcards.newcreditcard.type').setOptions(dw.order.PaymentMgr
        .getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).activePaymentCards.iterator());

    app.getView({
        ContinueURL: URLUtils.https('PaymentInstruments-PaymentForm'),
        SessionData: JSON.stringify(getSessionData()),
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
                response.redirect(URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'));
                return;
            } else {
                response.redirect(URLUtils.https('PaymentInstruments-List'));
            }
        },
        error: function () {
            add(false);
        }
    });
}
/**
 * Saves a  customer credit card payment instrument.
 * @param {Object} params
 * @param {dw.customer.CustomerPaymentInstrument} params.PaymentInstrument - credit card object.
 * @param {dw.web.FormGroup} params.CreditCardFormFields - new credit card form.
 */
function save(params) {
    var saveCustomerCreditCard = require('app_storefront_core/cartridge/scripts/checkout/SaveCustomerCreditCard');
    var result = saveCustomerCreditCard.save(params);
    if (result === PIPELET_ERROR) {
        throw new Error('Problem saving credit card');
    }
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
// ### Custom Adyen cartridge start ###
function create() {
    if(getAdyenPaymentInstruments()) {
        return adyenSaveCreditCard.create();
    }

    var paymentForm = app.getForm('paymentinstruments');
    var newCreditCardForm = paymentForm.get('creditcards.newcreditcard');
    var ccNumber = newCreditCardForm.get('number').value();

    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);

    if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()) {
        var createRecurringPaymentAccountResult = AdyenHelper.createRecurringPaymentAccount({
            Customer: customer
        });

        if (createRecurringPaymentAccountResult.error) {
            return false;
        }
        pspReference = 'PspReference' in createRecurringPaymentAccountResult && !empty(createRecurringPaymentAccountResult.PspReference) ? createRecurringPaymentAccountResult.PspReference : '';
        tokenID = 'TokenID' in createRecurringPaymentAccountResult && !empty(createRecurringPaymentAccountResult.TokenID) ? createRecurringPaymentAccountResult.TokenID : '';

        try {
            Transaction.wrap(function() {
                /*  var  newCreditCard  = customer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
                 * //   copy   the   credit   card   details   to   the   payment   instrument
                 * newCreditCard.setCreditCardHolder(
                            newCreditCard.setCreditCardNumber(
                            newCreditCard.setCreditCardType(
                            newCreditCard.setCreditCardToken(tokenID);
                            newCreditCard.custom.AdyenPspReference  =  pspReference; */
                require('int_adyen_overlay/cartridge/scripts/updateSavedCards').updateSavedCards({
                    CurrentCustomer: customer,
                    PaymentsMap: createRecurringPaymentAccountResult.PaymentsMap
                });
            });
        } catch (e) {
            AdyenLogs.error_log(`${e}: ${e.stack}`);
            return false;
        }
        return true;
    }
    var isDuplicateCard = false;
    var oldCard;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var card = paymentInstruments[i];
        if (card.creditCardNumber === ccNumber) {
            isDuplicateCard = true;
            oldCard = card;
            break;
        }
    }

    Transaction.begin();
    var paymentInstrument = wallet.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);

    try {
        save({
            PaymentInstrument: paymentInstrument,
            CreditCardFormFields: newCreditCardForm.object
        });
    } catch (err) {
        Transaction.rollback();
        return false;
    }

    if (isDuplicateCard) {
        wallet.removePaymentInstrument(oldCard);
    }

    Transaction.commit();

    paymentForm.clear();

    return true;
}
// ### Custom Adyen cartridge end ###

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
// ### Custom Adyen cartridge start ###
function Delete() {
    var paymentForm = app.getForm('paymentinstruments');
    paymentForm.handleAction({
        remove: function (formGroup, action) {
            Transaction.wrap(function () {
                var wallet = customer.getProfile().getWallet();
                var  paymentInstrument  =  action.object;
                if  (!empty(paymentInstrument))  {
                    if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()  && !empty(paymentInstrument.getCreditCardToken()))   {
                        var  result  = require('int_adyen_overlay/cartridge/scripts/adyenDeleteRecurringPayment').deleteRecurringPayment({
                            Customer:  customer,
                            RecurringDetailReference:  paymentInstrument.getCreditCardToken()
                        });
                        if (result   ==   PIPELET_NEXT)  {
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
// ### Custom Adyen cartridge end ###

/*
 * Private helpers
 */
// ### Custom Adyen cartridge start ###
function getAdyenPaymentInstruments() {
    var wallet = customer.getProfile().getWallet();
    return wallet.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
}
// ### Custom Adyen cartridge start ###

/**
 * Verifies if the entered credit card details are valid.
 *
 * @returns {boolean} true in case of success, otherwise false.
 */
// ### Custom Adyen cartridge start ###
function verifyCreditCard() {
    var newCreditCardForm = app.getForm('paymentinstruments.creditcards.newcreditcard');

    if(getAdyenPaymentInstruments()) {
        return true;
    }
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
// ### Custom Adyen cartridge end ###

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
