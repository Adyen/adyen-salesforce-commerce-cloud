'use strict';

/**
 * Controller for the billing logic. It is used by both the single shipping and the multishipping
 * functionality and is responsible for payment method selection and entering a billing address.
 *
 * @module controllers/COBilling
 */

/* API Includes */
var GiftCertificate = require('dw/order/GiftCertificate');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Countries = require('app_storefront_core/cartridge/scripts/util/Countries');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');
// ### Custom Adyen cartridge start ###
var AdyenController = require("int_adyen_controllers/cartridge/controllers/Adyen");
var AdyenHelper = require("int_adyen_overlay/cartridge/scripts/util/adyenHelper");
var AdyenConfigs = require("int_adyen_overlay/cartridge/scripts/util/adyenConfigs");
var constants = require("*/cartridge/adyenConstants/constants");
// ### Custom Adyen cartridge end ###
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');


/**
 * Initializes the address form. If the customer chose "use as billing
 * address" option on the single shipping page the form is prepopulated with the shipping
 * address, otherwise it prepopulates with the billing address that was already set.
 * If neither address is available, it prepopulates with the default address of the authenticated customer.
 */
function initAddressForm(cart) {

    if (app.getForm('singleshipping').object.shippingAddress.useAsBillingAddress.value === true) {
        app.getForm('billing').object.billingAddress.addressFields.firstName.value = app.getForm('singleshipping').object.shippingAddress.addressFields.firstName.value;
        app.getForm('billing').object.billingAddress.addressFields.lastName.value = app.getForm('singleshipping').object.shippingAddress.addressFields.lastName.value;
        app.getForm('billing').object.billingAddress.addressFields.address1.value = app.getForm('singleshipping').object.shippingAddress.addressFields.address1.value;
        app.getForm('billing').object.billingAddress.addressFields.address2.value = app.getForm('singleshipping').object.shippingAddress.addressFields.address2.value;
        app.getForm('billing').object.billingAddress.addressFields.city.value = app.getForm('singleshipping').object.shippingAddress.addressFields.city.value;
        app.getForm('billing').object.billingAddress.addressFields.postal.value = app.getForm('singleshipping').object.shippingAddress.addressFields.postal.value;
        app.getForm('billing').object.billingAddress.addressFields.phone.value = app.getForm('singleshipping').object.shippingAddress.addressFields.phone.value;
        app.getForm('billing').object.billingAddress.addressFields.states.state.value = app.getForm('singleshipping').object.shippingAddress.addressFields.states.state.value;
        app.getForm('billing').object.billingAddress.addressFields.country.value = app.getForm('singleshipping').object.shippingAddress.addressFields.country.value;
        app.getForm('billing').object.billingAddress.addressFields.phone.value = app.getForm('singleshipping').object.shippingAddress.addressFields.phone.value;
    } else if (cart.getBillingAddress() !== null) {
        app.getForm('billing.billingAddress.addressFields').copyFrom(cart.getBillingAddress());
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(cart.getBillingAddress());
    } else if (customer.authenticated && customer.profile.addressBook.preferredAddress !== null) {

        app.getForm('billing.billingAddress.addressFields').copyFrom(customer.profile.addressBook.preferredAddress);
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(customer.profile.addressBook.preferredAddress);
    }
}

/**
 * Initializes the email address form field. If there is already a customer
 * email set at the basket, that email address is used. If the
 * current customer is authenticated the email address of the customer's profile
 * is used.
 */
function initEmailAddress(cart) {
    if (cart.getCustomerEmail() !== null) {
        app.getForm('billing').object.billingAddress.email.emailAddress.value = cart.getCustomerEmail();
    } else if (customer.authenticated && customer.profile.email !== null) {
        app.getForm('billing').object.billingAddress.email.emailAddress.value = customer.profile.email;
    }
}

/**
 * Updates data for the billing page and renders it.
 * If payment method is set to gift certificate, gets the gift certificate code from the form.
 * Updates the page metadata. Gets a view and adds any passed parameters to it. Sets the Basket and ContinueURL properties.
 * Renders the checkout/billing/billing template.
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @param {object} params - (optional) if passed, added to view properties so they can be accessed in the template.
 */
// ### Custom Adyen cartridge start ###
function returnToForm(cart, params) {
    var pageMeta = require('~/cartridge/scripts/meta');

    // if the payment method is set to gift certificate get the gift certificate code from the form
    if (!empty(cart.getPaymentInstrument()) && cart.getPaymentInstrument().getPaymentMethod() === PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
        app.getForm('billing').copyFrom({
            giftCertCode: cart.getPaymentInstrument().getGiftCertificateCode()
        });
    }

    pageMeta.update({
        pageTitle: Resource.msg('billing.meta.pagetitle', 'checkout', 'SiteGenesis Checkout')
    });

    if (params) {
        app.getView(require('~/cartridge/scripts/object').extend(params, {
            Basket: cart.object,
            AdyenHelper : AdyenHelper,
            ContinueURL: URLUtils.https('COBilling-Billing')
        })).render('checkout/billing/billing');
    } else {
        app.getView({
            Basket: cart.object,
            AdyenHelper : AdyenHelper,
            ContinueURL: URLUtils.https('COBilling-Billing')
        }).render('checkout/billing/billing');
    }
}
// ### Custom Adyen cartridge end ###

/**
 * Updates cart calculation and page information and renders the billing page.
 * @transactional
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @param {object} params - (optional) if passed, added to view properties so they can be accessed in the template.
 */
function start(cart, params) {

    app.getController('COShipping').PrepareShipments();

    Transaction.wrap(function () {
        cart.calculate();
    });

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update({
        pageTitle: Resource.msg('billing.meta.pagetitle', 'checkout', 'SiteGenesis Checkout')
    });
    returnToForm(cart, params);
}

/**
 * Initializes the credit card list by determining the saved customer payment methods for the current locale.
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @return {object} JSON object with members ApplicablePaymentMethods and ApplicableCreditCards.
 */
function initCreditCardList(cart) {
    var paymentAmount = cart.getNonGiftCertificateAmount();
    var countryCode;
    var applicablePaymentMethods;
    var applicablePaymentCards;
    var applicableCreditCards;

    countryCode = Countries.getCurrent({
        CurrentRequest: {
            locale: request.locale
        }
    }).countryCode;

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(customer, countryCode, paymentAmount.value);
    applicablePaymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(customer, countryCode, paymentAmount.value);

    app.getForm('billing').object.paymentMethods.creditCard.type.setOptions(applicablePaymentCards.iterator());

    applicableCreditCards = null;

    if (customer.authenticated) {
        var profile = app.getModel('Profile').get();
        if (profile) {
            applicableCreditCards = profile.validateWalletPaymentInstruments(countryCode, paymentAmount.getValue()).ValidPaymentInstruments;
        }
    }

    return {
        ApplicablePaymentMethods: applicablePaymentMethods,
        ApplicableCreditCards: applicableCreditCards
    };
}

/**
 * Starting point for billing. After a successful shipping setup, both COShipping
 * and COShippingMultiple call this function.
 */
// ### Custom Adyen cartridge start ###
function publicStart() {
    var cart = app.getModel('Cart').get();
    if (cart) {

        // Initializes all forms of the billing page including: - address form - email address - coupon form
        initAddressForm(cart);
        initEmailAddress(cart);

        // Get the Saved Cards from Adyen to get latest saved cards
        if (customer.authenticated) {
            require('int_adyen_overlay/cartridge/scripts/updateSavedCards').updateSavedCards({CurrentCustomer : customer});
        }
        var creditCardList = initCreditCardList(cart);
        var applicablePaymentMethods = creditCardList.ApplicablePaymentMethods;

        var billingForm = app.getForm('billing').object;
        var paymentMethods = billingForm.paymentMethods;
        if (paymentMethods.valid) {
            paymentMethods.selectedPaymentMethodID.setOptions(applicablePaymentMethods.iterator());
        } else {
            paymentMethods.clearFormElement();
        }

        app.getForm('billing.couponCode').clear();
        app.getForm('billing.giftCertCode').clear();

        var AdyenSessionsResponse = AdyenController.Sessions(customer);

        // var AdyenPosTerminals = AdyenController.GetTerminals();
        //TODO fix terminals
        start(cart, {ApplicableCreditCards: creditCardList.ApplicableCreditCards, AdyenSessionsResponse : AdyenSessionsResponse});


    } else {
        app.getController('Cart').Show();
    }
}
// ### Custom Adyen cartridge end ###

/**
 * Adjusts gift certificate redemptions after applying coupon(s), because this changes the order total.
 * Removes and then adds currently added gift certificates to reflect order total changes.
 */
function adjustGiftCertificates() {
    var i, j, cart, gcIdList, gcID, gc;
    cart = app.getModel('Cart').get();

    if (cart) {
        gcIdList = cart.getGiftCertIdList();

        Transaction.wrap(function () {
            for (i = 0; i < gcIdList.length; i += 1) {
                cart.removeGiftCertificatePaymentInstrument(gcIdList[i]);
            }

            gcID = null;

            for (j = 0; j < gcIdList.length; j += 1) {
                gcID = gcIdList[j];

                gc = GiftCertificateMgr.getGiftCertificateByCode(gcID);

                if ((gc) && // make sure exists
                (gc.isEnabled()) && // make sure it is enabled
                (gc.getStatus() !== GiftCertificate.STATUS_PENDING) && // make sure it is available for use
                (gc.getStatus() !== GiftCertificate.STATUS_REDEEMED) && // make sure it has not been fully redeemed
                (gc.balance.currencyCode === cart.getCurrencyCode())) {// make sure the GC is in the right currency
                    cart.createGiftCertificatePaymentInstrument(gc);
                }
            }
        });
    }
}

/**
 * Used to adjust gift certificate totals, update page metadata, and render the billing page.
 * This function is called whenever a billing form action is handled.
 * @see {@link module:controllers/COBilling~returnToForm|returnToForm}
 * @see {@link module:controllers/COBilling~adjustGiftCertificates|adjustGiftCertificates}
 * @see {@link module:controllers/COBilling~billing|billing}
 */
function handleCoupon() {
    var CouponError;
    // @FIXME what is that used for?
    if (empty(CouponError)) {
        /*
         * Adjust gift certificate redemptions as after applying coupon(s),
         * order total is changed. AdjustGiftCertificate pipeline removes and
         * then adds currently added gift certificates to reflect order total
         * changes.
         */
        adjustGiftCertificates();
    }

    returnToForm(app.getModel('Cart').get());
}

/**
 * Redeems a gift certificate. If the gift certificate was not successfully
 * redeemed, the form field is invalidated with the appropriate error message.
 * If the gift certificate was redeemed, the form gets cleared. This function
 * is called by an Ajax request and generates a JSON response.
 * @param {String} giftCertCode - Gift certificate code entered into the giftCertCode field in the billing form.
 * @returns {object} JSON object containing the status of the gift certificate.
 */
function redeemGiftCertificate(giftCertCode) {
    var cart, gc, newGCPaymentInstrument, gcPaymentInstrument, status, result;
    cart = app.getModel('Cart').get();

    if (cart) {
        // fetch the gift certificate
        gc = GiftCertificateMgr.getGiftCertificateByCode(giftCertCode);

        if (!gc) {// make sure exists
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_NOT_FOUND);
        } else if (!gc.isEnabled()) {// make sure it is enabled
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_DISABLED);
        } else if (gc.getStatus() === GiftCertificate.STATUS_PENDING) {// make sure it is available for use
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_PENDING);
        } else if (gc.getStatus() === GiftCertificate.STATUS_REDEEMED) {// make sure it has not been fully redeemed
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_INSUFFICIENT_BALANCE);
        } else if (gc.balance.currencyCode !== cart.getCurrencyCode()) {// make sure the GC is in the right currency
            result = new Status(Status.ERROR, GiftCertificateStatusCodes.GIFTCERTIFICATE_CURRENCY_MISMATCH);
        } else {
            newGCPaymentInstrument = Transaction.wrap(function () {
                gcPaymentInstrument = cart.createGiftCertificatePaymentInstrument(gc);
                cart.calculate();
                return gcPaymentInstrument;
            });

            status = new Status(Status.OK);
            status.addDetail('NewGCPaymentInstrument', newGCPaymentInstrument);
            result = status;
        }
    } else {
        result = new Status(Status.ERROR, 'BASKET_NOT_FOUND');
    }
    return result;
}

/**
 * Updates credit card information from the httpParameterMap and determines if there is a currently selected credit card.
 * If a credit card is selected, it adds the the credit card number to the billing form. Otherwise, the {@link module:controllers/COBilling~publicStart|publicStart} method is called.
 * In either case, it will initialize the credit card list in the billing form and call the {@link module:controllers/COBilling~start|start} function.
 */
function updateCreditCardSelection() {
    var cart, applicableCreditCards, UUID, selectedCreditCard, instrumentsIter, creditCardInstrument;
    cart = app.getModel('Cart').get();

    applicableCreditCards = initCreditCardList(cart).ApplicableCreditCards;

    UUID = request.httpParameterMap.creditCardUUID.value || request.httpParameterMap.dwfrm_billing_paymentMethods_creditCardList.stringValue;

    selectedCreditCard = null;
    if (UUID && applicableCreditCards && !applicableCreditCards.empty) {

        // find credit card in payment instruments
        instrumentsIter = applicableCreditCards.iterator();
        while (instrumentsIter.hasNext()) {
            creditCardInstrument = instrumentsIter.next();
            if (UUID.equals(creditCardInstrument.UUID)) {
                selectedCreditCard = creditCardInstrument;
            }
        }

        if (selectedCreditCard) {
            app.getForm('billing').object.paymentMethods.creditCard.number.value = selectedCreditCard.creditCardNumber;
        } else {
            publicStart();
        }
    } else {
        publicStart();
    }

    app.getForm('billing.paymentMethods.creditCard').copyFrom(selectedCreditCard);

    initCreditCardList(cart);
    start(cart);
}

/**
 * Clears the form element for the currently selected payment method and removes the other payment methods.
 *
 * @return {Boolean} Returns true if payment is successfully reset. Returns false if the currently selected payment
 * method is bml and the ssn cannot be validated.
 */
function resetPaymentForms() {

    var cart = app.getModel('Cart').get();

    var status = Transaction.wrap(function () {
        if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals('PayPal')) {
            app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();
            app.getForm('billing').object.paymentMethods.bml.clearFormElement();

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
        } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
            app.getForm('billing').object.paymentMethods.bml.clearFormElement();

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
            cart.removePaymentInstruments(cart.getPaymentInstruments('PayPal'));
        } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_BML)) {
            app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();

            if (!app.getForm('billing').object.paymentMethods.bml.ssn.valid) {
                return false;
            }

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            cart.removePaymentInstruments(cart.getPaymentInstruments('PayPal'));
        }
        return true;
    });

    return status;
}

/**
 * Validates the billing form.
 * @returns {boolean} Returns true if the billing address is valid or no payment is needed. Returns false if the billing form is invalid.
 */
function validateBilling() {
    if (!app.getForm('billing').object.billingAddress.valid) {
        return false;
    }

    if (!empty(request.httpParameterMap.noPaymentNeeded.value)) {
        return true;
    }

    if (!empty(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value) && app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        if (!app.getForm('billing').object.valid) {
            return false;
        }
    }
    return true;
}

/**
 * Handles the selection of the payment method and performs payment method-specific
 * validation and verification on the entered form fields. If the
 * order total is 0 (if the user has product promotions) then we do not
 * need a valid payment method.
 */
function handlePaymentSelection(cart) {
    var result;
    if (empty(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value)) {
        if (cart.getTotalGrossPrice() > 0) {
            result = {
                error: true
            };
        } else {
            result = {
                ok: true
            };
        }
    }

    // skip the payment handling if the whole payment was made using gift cert
    if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
        result = {
            ok: true
        };
    }

    if (empty(PaymentMgr.getPaymentMethod(app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value).paymentProcessor)) {
        result = {
            error: true,
            MissingPaymentProcessor: true
        };
    }
    if (!result) {
        result = app.getModel('PaymentProcessor').handle(cart.object, app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value);
    }
    return result;
}

/**
 * Gets or creates a billing address and copies it to the billingaddress form. Also sets the customer email address
 * to the value in the billingAddress form.
 * @transaction
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @returns {boolean} true
 */
function handleBillingAddress(cart) {

    var billingAddress = cart.getBillingAddress();
    Transaction.wrap(function () {

        if (!billingAddress) {
            billingAddress = cart.createBillingAddress();
        }

        app.getForm('billing.billingAddress.addressFields').copyTo(billingAddress);
        app.getForm('billing.billingAddress.addressFields.states').copyTo(billingAddress);

        cart.setCustomerEmail(app.getForm('billing').object.billingAddress.email.emailAddress.value);
    });

    return true;
}

/**
 * Checks if there is currently a cart and if one exists, gets the customer address from the httpParameterMap and saves it to the customer address book.
 * Initializes the list of credit cards and calls the {@link module:controllers/COBilling~start|start} function.
 * If a cart does not already exist, calls the {@link module:controllers/Cart~Show|Cart controller Show function}.
 */
function updateAddressDetails() {
    var cart, address, billingAddress;
    cart = app.getModel('Cart').get();

    if (cart) {

        address = customer.getAddressBook().getAddress(empty(request.httpParameterMap.addressID.value) ? request.httpParameterMap.dwfrm_billing_addressList.value : request.httpParameterMap.addressID.value);

        app.getForm('billing.billingAddress.addressFields').copyFrom(address);
        app.getForm('billing.billingAddress.addressFields.states').copyFrom(address);

        billingAddress = cart.getBillingAddress();

        app.getForm('billing.billingAddress.addressFields').copyTo(billingAddress);

        initCreditCardList(cart);
        start(cart);
    } else {
        //@FIXME redirect
        app.getController('Cart').Show();
    }
}

/**
 * Form handler for the billing form. Handles the following actions:
 * - __applyCoupon__ - gets the coupon to add from the httpParameterMap couponCode property and calls {@link module:controllers/COBilling~handleCoupon|handleCoupon}
 * - __creditCardSelect__ - calls the {@link module:controllers/COBilling~updateCreditCardSelection|updateCreditCardSelection} function.
 * - __paymentSelect__ - calls the {@link module:controllers/COBilling~publicStart|publicStart} function.
 * - __redeemGiftCert__ - redeems the gift certificate entered into the billing form and returns to the cart.
 * - __save__ - validates payment and address information and handles any errors. If the billing form is valid,
 * saves the billing address to the customer profile, sets a flag to indicate the billing step is successful, and calls
 * the {@link module:controllers/COSummary~start|COSummary controller Start function}.
 * - __selectAddress__ - calls the {@link module:controllers/COBilling~updateAddressDetails|updateAddressDetails} function.
 */
// ### Custom Adyen cartridge start ###
function billing(data) {
    // restore cart and redirect to billing stage if successful
    if(session.privacy.currentOrderNumber && session.privacy.currentOrderToken) {
        var order = OrderMgr.getOrder(session.privacy.currentOrderNumber, session.privacy.currentOrderToken);

        // Clear cache so the order restore will only be attmpted once per order
        session.privacy.currentOrderNumber = null;
        session.privacy.currentOrderToken = null;

        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        publicStart();
        return;
    }

    if(!validateBilling()) {
        var responseUtils = require('~/cartridge/scripts/util/Response');
        responseUtils.renderJSON({fieldErrors: true});
    }
    var paymentInformation = app.getForm('adyPaydata');
    if(paymentInformation.get("paymentFromComponentStateData").value()) {
        AdyenController.ShowConfirmationPaymentFromComponent();
        return;
    }
    app.getForm('billing').handleAction({
        applyCoupon: function () {
            var couponCode = request.httpParameterMap.couponCode.stringValue || request.httpParameterMap.dwfrm_billing_couponCode.stringValue;

            // TODO what happened to this start node?
            app.getController('Cart').AddCoupon(couponCode);

            handleCoupon();
            return;
        },
        creditCardSelect: function () {
            updateCreditCardSelection();
            return;
        },
        paymentSelect: function () {
            // ToDo - pass parameter ?
            publicStart();
            return;
        },
        redeemGiftCert: function () {
            var status = redeemGiftCertificate(app.getForm('billing').object.giftCertCode.htmlValue);
            if (!status.isError()) {
                returnToForm(app.getModel('Cart').get(), {
                    NewGCPaymentInstrument: status.getDetail('NewGCPaymentInstrument')
                });
            } else {
                returnToForm(app.getModel('Cart').get());
            }
            return;
        },
        save: function () {
            Transaction.wrap(function () {
                var cart = app.getModel('Cart').get();

                if (!resetPaymentForms() || !validateBilling() || !handleBillingAddress(cart) || // Performs validation steps, based upon the entered billing address
                // and address options.
                handlePaymentSelection(cart).error) {// Performs payment method specific checks, such as credit card verification.
                    returnToForm(cart);
                } else {
                    if (customer.authenticated && app.getForm('billing').object.billingAddress.addToAddressBook.value) {
                        app.getModel('Profile').get(customer.profile).addAddressToAddressBook(cart.getBillingAddress());
                    }
                    // Mark step as fulfilled
                    app.getForm('billing').object.fulfilled.value = true;

                    if(!paymentInformation.get("paymentFromComponentStateData").value()) {
                        // A successful billing page will jump to the next checkout step.
                        app.getController('COSummary').Start();
                    }
                    return;
                }
            });
        },
        selectAddress: function () {
            updateAddressDetails();
            return;
        }
    });
}
// ### Custom Adyen cartridge end ###

/**
* Gets the gift certificate code from the httpParameterMap and redeems it. For an ajax call, renders an empty JSON object.
* Otherwise, renders a JSON object with information about the gift certificate code and the success and status of the redemption.
*/
function redeemGiftCertificateJson() {
    var giftCertCode, giftCertStatus;

    giftCertCode = request.httpParameterMap.giftCertCode.stringValue;
    giftCertStatus = redeemGiftCertificate(giftCertCode);

    let responseUtils = require('~/cartridge/scripts/util/Response');

    if (request.httpParameterMap.format.stringValue !== 'ajax') {
        // @FIXME we could also build an ajax guard?
        responseUtils.renderJSON({});
    } else {
        responseUtils.renderJSON({
            status: giftCertStatus.code,
            success: !giftCertStatus.error,
            message: Resource.msgf('billing.' + giftCertStatus.code, 'checkout', null, giftCertCode),
            code: giftCertCode
        });
    }
}

/**
 * Removes gift certificate from the basket payment instruments and
 * generates a JSON response with a status. This function is called by an Ajax
 * request.
 */
function removeGiftCertificate() {
    if (!empty(request.httpParameterMap.giftCertificateID.stringValue)) {
        var cart = app.getModel('Cart').get();

        Transaction.wrap(function () {
            cart.removeGiftCertificatePaymentInstrument(request.httpParameterMap.giftCertificateID.stringValue);
            cart.calculate();
        });
    }

    publicStart();
}

/**
 * Updates the order totals and recalculates the basket after a coupon code is applied.
 * Renders the checkout/minisummary template, which includes the mini cart order totals and shipment summary.
 */
function updateSummary() {

    var cart = app.getModel('Cart').get();

    Transaction.wrap(function () {
        cart.calculate();
    });

    app.getView({
        checkoutstep: 4,
        Basket: cart.object
    }).render('checkout/minisummary');
}

/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened
 * by an Ajax request and ends in templates, which trigger a certain JavaScript
 * event. The calling page of this dialog is responsible for handling these
 * events.
 */
function editAddress() {

    app.getForm('billing').objectaddress.clearFormElement();

    var address = customer.getAddressBook().getAddress(request.httpParameterMap.addressID.stringValue);

    if (address) {
        app.getForm('billinaddress').copyFrom(address);
        app.getForm('billingaggdress.states').copyFrom(address);
    }

    app.getView({
        ContinueURL: URLUtils.https('COBilling-EditBillingAddress')
    }).render('checkout/billing/billingaddressdetails');
}

/**
 * Form handler for the returnToForm form.
 * - __apply __ - attempts to save billing address information to the platform. If there is an error, renders the
 * components/dialog/dialogapply template. If it is successful, sets the ContinueURL to {@link module:controllers/COBilling~EditBillingAddress|EditBillingAddress} and renders the
 * checkout/billing/billingaddressdetails template.
 * - __remove __ - Checks if the customer owns any product lists. If they do not, removes the address from the customer address book
 * and renders the components/dialog/dialogdelete template.
 * If they do own product lists, sets the ContinueURL to {@link module:controllers/COBilling~EditBillingAddress|EditBillingAddress} and renders the checkout/billing/billingaddressdetails template.
 */
function editBillingAddress() {

    app.getForm('returnToForm').handleAction({
        apply: function () {
            if (!app.getForm('billingaddress').copyTo(app.getForm('billingaddress').object)) {
                app.getView({
                    ContinueURL: URLUtils.https('COBilling-EditBillingAddress')
                }).render('checkout/billing/billingaddressdetails');
            } else {
                app.getView().render('components/dialog/dialogapply');
            }
        },
        remove: function () {
            if (ProductListMgr.getProductLists(app.getForm('billing').objectaddress.object).isEmpty()) {
                customer.getAddressBook().removeAddress(app.getForm('billing').objectaddress.object);
                app.getView().render('components/dialog/dialogdelete');
            } else {
                app.getView({
                    ContinueURL: URLUtils.https('COBilling-EditBillingAddress')
                }).render('checkout/billing/billingaddressdetails');
            }
        }
    });
}

/**
 * Returns information of a gift certificate including its balance as JSON
 * response. Required to check the remaining balance.
 */
function getGiftCertificateBalance() {
    var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(request.httpParameterMap.giftCertificateID.value);
    var responseUtils = require('~/cartridge/scripts/util/Response');

    if (giftCertificate && giftCertificate.isEnabled()) {
        responseUtils.renderJSON({
            giftCertificate: {
                ID: giftCertificate.getGiftCertificateCode(),
                balance: StringUtils.formatMoney(giftCertificate.getBalance())
            }
        });
    } else {
        responseUtils.renderJSON({
            error: Resource.msg('billing.giftcertinvalid', 'checkout', null)
        });
    }
}

/**
 * Selects a customer credit card and returns the details of the credit card as
 * JSON response. Required to fill credit card form with details of selected
 * credit card.
 */
function selectCreditCard() {
    var cart, applicableCreditCards, selectedCreditCard, instrumentsIter, creditCardInstrument;
    cart = app.getModel('Cart').get();

    applicableCreditCards = initCreditCardList(cart).ApplicableCreditCards;
    selectedCreditCard = null;

    // ensure mandatory parameter 'CreditCardUUID' and 'CustomerPaymentInstruments'
    // in pipeline dictionary and collection is not empty
    if (request.httpParameterMap.creditCardUUID.value && applicableCreditCards && !applicableCreditCards.empty) {

        // find credit card in payment instruments
        instrumentsIter = applicableCreditCards.iterator();
        while (instrumentsIter.hasNext()) {
            creditCardInstrument = instrumentsIter.next();
            if (request.httpParameterMap.creditCardUUID.value.equals(creditCardInstrument.UUID)) {
                selectedCreditCard = creditCardInstrument;
            }
        }

        if (selectedCreditCard) {
            app.getForm('billing').object.paymentMethods.creditCard.number.value = selectedCreditCard.getCreditCardNumber();
        }
    }

    app.getView({
        SelectedCreditCard: selectedCreditCard
    }).render('checkout/billing/creditcardjson');
}

/**
 * Revalidates existing payment instruments in later checkout steps.
 *
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @return {Boolean} true if existing payment instruments are valid, false if not.
 */
// ### Custom Adyen cartridge start ###
function validatePayment(cart) {
    var paymentAmount, countryCode, invalidPaymentInstruments, result;
    if (cart.getPaymentInstrument() &&
    [
        constants.METHOD_ADYEN_POS,
        constants.METHOD_ADYEN_COMPONENT,
        ].indexOf(cart.getPaymentInstrument().getPaymentMethod()) !== -1
    ) {
        result = true;
        return result;
    }
    if (app.getForm('billing').object.fulfilled.value) {
        paymentAmount = cart.getNonGiftCertificateAmount();
        countryCode = Countries.getCurrent({
            CurrentRequest: {
                locale: request.locale
            }
        }).countryCode;

        invalidPaymentInstruments = cart.validatePaymentInstruments(customer, countryCode, paymentAmount.value).InvalidPaymentInstruments;

        if (!invalidPaymentInstruments && cart.calculatePaymentTransactionTotal()) {
            result = true;
        } else {
            app.getForm('billing').object.fulfilled.value = false;
            result = false;
        }
    } else {
        result = false;
    }
    return result;
}
// ### Custom Adyen cartridge end ###

/**
 * Attempts to save the used credit card in the customer payment instruments.
 * The logic replaces an old saved credit card with the same masked credit card
 * number of the same card type with the new credit card. This ensures creating
 * only unique cards as well as replacing expired cards.
 * @transactional
 * @return {Boolean} true if credit card is successfully saved.
 */
// ### Custom Adyen cartridge start ###
function saveCreditCard() {
    if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()) {
        //saved credit cards are handling in COPlaceOrder and Login for Adyen - saved cards are synced with Adyen ListRecurringDetails API call
        return true;
    } else {
        var i, creditCards, newCreditCard;

        if (customer.authenticated && app.getForm('billing').object.paymentMethods.creditCard.saveCard.value) {
            creditCards = customer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);

            Transaction.wrap(function () {
                newCreditCard = customer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);

                // copy the credit card details to the payment instrument
                newCreditCard.setCreditCardHolder(app.getForm('billing').object.paymentMethods.creditCard.owner.value);
                newCreditCard.setCreditCardNumber(app.getForm('billing').object.paymentMethods.creditCard.number.value);
                newCreditCard.setCreditCardExpirationMonth(app.getForm('billing').object.paymentMethods.creditCard.expiration.month.value);
                newCreditCard.setCreditCardExpirationYear(app.getForm('billing').object.paymentMethods.creditCard.expiration.year.value);
                newCreditCard.setCreditCardType(app.getForm('billing').object.paymentMethods.creditCard.type.value);

                for (i = 0; i < creditCards.length; i++) {
                    var creditcard = creditCards[i];

                    if (creditcard.maskedCreditCardNumber === newCreditCard.maskedCreditCardNumber && creditcard.creditCardType === newCreditCard.creditCardType) {
                        customer.getProfile().getWallet().removePaymentInstrument(creditcard);
                    }
                }
            });

        }
        return true;
    }
}
// ### Custom Adyen cartridge end ###

/*
* Module exports
*/

/*
* Web exposed methods
*/
/** Starting point for billing.
 * @see module:controllers/COBilling~publicStart */
exports.Start = guard.ensure(['https'], publicStart);

/** Redeems gift certificates.
 * @see module:controllers/COBilling~redeemGiftCertificateJson */
exports.RedeemGiftCertificateJson = guard.ensure(['https', 'get'], redeemGiftCertificateJson);
/** Removes gift certificate from the basket payment instruments.
 * @see module:controllers/COBilling~removeGiftCertificate */
exports.RemoveGiftCertificate = guard.ensure(['https', 'get'], removeGiftCertificate);
/** Updates the order totals and recalculates the basket after a coupon code is applied.
 * @see module:controllers/COBilling~updateSummary */
exports.UpdateSummary = guard.ensure(['https', 'get'], updateSummary);
/** Gets the customer address and saves it to the customer address book.
 * @see module:controllers/COBilling~updateAddressDetails */
exports.UpdateAddressDetails = guard.ensure(['https', 'get'], updateAddressDetails);
/** Renders a form dialog to edit an address.
 * @see module:controllers/COBilling~editAddress */
exports.EditAddress = guard.ensure(['https', 'get', 'csrf'], editAddress);
/** Returns information of a gift certificate including its balance as JSON response.
 * @see module:controllers/COBilling~getGiftCertificateBalance */
exports.GetGiftCertificateBalance = guard.ensure(['https', 'get'], getGiftCertificateBalance);
/** Selects a customer credit card and returns the details of the credit card as JSON response.
 * @see module:controllers/COBilling~selectCreditCard */
exports.SelectCreditCard = guard.ensure(['https', 'get'], selectCreditCard);
/** Adds the currently selected credit card to the billing form and initializes the credit card selection list.
 * @see module:controllers/COBilling~updateCreditCardSelection */
exports.UpdateCreditCardSelection = guard.ensure(['https', 'get'], updateCreditCardSelection);
/** Form handler for the billing form.
 * @see module:controllers/COBilling~billing */
exports.Billing = guard.ensure(['https', 'csrf'], billing);
/** Form handler for the returnToForm form.
 * @see module:controllers/COBilling~editBillingAddress */
exports.EditBillingAddress = guard.ensure(['https', 'post'], editBillingAddress);
/*
 * Local methods
 */
/** Saves the credit card used in the billing form in the customer payment instruments.
 * @see module:controllers/COBilling~saveCreditCard */
exports.SaveCreditCard = saveCreditCard;
/** Revalidates existing payment instruments in later checkout steps.
 * @see module:controllers/COBilling~validatePayment */
exports.ValidatePayment = validatePayment;
/** Handles the selection of the payment method and performs payment method specific validation and verification upon the entered form fields.
 * @see module:controllers/COBilling~handlePaymentSelection */
exports.HandlePaymentSelection = handlePaymentSelection;
