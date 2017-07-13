'use strict';

/**
 * Controller for gift certificate purchases.
 *
 * @module controllers/GiftCert
 */

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var HashMap = require('dw/util/HashMap');
var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var RateLimiter = require('app_storefront_core/cartridge/scripts/util/RateLimiter');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Cart = app.getModel('Cart');
var ProductList = app.getModel('ProductList');

/**
 * Clears the giftcert form and calls the {@link module:controllers/GiftCert~showPurchase|showPurchase} function to
 * render the page to purchase a gift certificate.
 *
 */
function purchase() {
    app.getForm('giftcert').clear();

    showPurchase();
}

/**
 * Internal helper function that prepares and shows the purchase page without clearing the form.
 * Populates the giftcert.purchase with information from the httpParameterMap and the customer profile.
 * Sets the ContinueURL to {@link module:controllers/GiftCert~addToBasket|GiftCert-AddToBasket}
 *  and renders the purchase page (checkout/giftcert/giftcertpurchase template).
 */
function showPurchase() {
    var parameterMap = request.httpParameterMap;
    var purchaseForm = app.getForm('giftcert.purchase');


    if (parameterMap.from.stringValue || parameterMap.recipient.stringValue) {
        purchaseForm.setValue('from', parameterMap.from.stringValue);
        purchaseForm.setValue('recipient', parameterMap.recipient.stringValue);
    }


    if (customer.registered) {
        purchaseForm.setValue('from', customer.profile.firstName + ' ' + customer.profile.lastName);
    }


    if (!parameterMap.plid.empty) {
        var productList = ProductList.get(parameterMap.plid.value).object;
        if (productList) {
            purchaseForm.setValue('recipient', productList.owner.profile.firstName + ' ' +
                productList.owner.profile.lastName);
            purchaseForm.setValue('recipientEmail', productList.owner.profile.email);
            purchaseForm.setValue('confirmRecipientEmail', productList.owner.profile.email);
            purchaseForm.setValue('lineItemId', parameterMap.itemid.stringValue);
        }
    }

    app.getView({
        bctext1: 'gc',
        bcurl1: null,
        ContinueURL: URLUtils.https('GiftCert-AddToBasket')
    }).render('checkout/giftcert/giftcertpurchase');
}

/**
 * Internal helper to show errors on the purchase page.
 * For an ajax request, renders a JSON object (checkout/giftcert/giftcertaddtobasketjson template).
 * Otherwise, calls the {@link module:controllers/GiftCert~showPurchase|showPurchase} function.
 * @param  {Object} args
 * @param  {dw.util.Map} args.FormErrors Errors from the form.
 * @param  {String} args.GeneralError Errors from the page.
 */
function showError(args) {
    if (request.httpParameterMap.format.stringValue === 'ajax') {
        app.getView({
            GeneralError: args.GeneralError,
            FormErrors: args.FormErrors || new HashMap()
        }).render('checkout/giftcert/giftcertaddtobasketjson');
        return;
    }

    showPurchase();
}


/**
 * Updates and renders the gift certificate purchase page.
 * Clears the giftcert form and assigns values to the giftcert.purchase form from the gift certificate line item. Sets ContinueURL to GiftCert-Update
 * and renders the gift certificate purchase page (checkout/giftcert/giftcertpurchase template).
 * If there is no existing cart or no gift certificate line item, calls the {@link module:controllers/GiftCert~purchase|purchase} function.
 */
function edit() {
    var cart = Cart.get();
    if (!cart) {
        purchase();
        return;
    }
    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(request.httpParameterMap.GiftCertificateLineItemID.value);
    if (!giftCertificateLineItem) {
        purchase();
        return;
    }

    var giftcertForm = app.getForm('giftcert');
    giftcertForm.clear();

    var purchaseForm = app.getForm('giftcert.purchase');
    purchaseForm.setValue('lineItemId', giftCertificateLineItem.UUID);
    purchaseForm.setValue('from', giftCertificateLineItem.senderName);
    purchaseForm.setValue('recipient', giftCertificateLineItem.recipientName);
    purchaseForm.setValue('recipientEmail', giftCertificateLineItem.recipientEmail);
    purchaseForm.setValue('confirmRecipientEmail', giftCertificateLineItem.recipientEmail);
    purchaseForm.setValue('message', giftCertificateLineItem.message);
    purchaseForm.setValue('amount', giftCertificateLineItem.price.value);

    app.getView({
        GiftCertificateLineItem: giftCertificateLineItem,
        ContinueURL: URLUtils.https('GiftCert-Update')
    }).render('checkout/giftcert/giftcertpurchase');
}


/**
 * Displays the details of a gift certificate as a JSON object in order to check the
 * current balance. If an error occurs, renders an error message.
 */
function checkBalance() {
    var params = request.httpParameterMap;

    // Check to see if the number of attempts has exceeded the session threshold
    if (RateLimiter.isOverThreshold('GCBalanceCounter')) {
        RateLimiter.showCaptcha();
    }

    var giftCertificate = null;

    var giftCertID = params.giftCertID.stringValue || params.dwfrm_giftcert_balance_giftCertID.stringValue;
    if (giftCertID) {
        giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertID);
    }

    if (!empty(giftCertificate) && giftCertificate.enabled) {
        app.getView({
            GiftCertificate: giftCertificate
        }).render('checkout/giftcert/giftcertpurchase');
        RateLimiter.hideCaptcha();
    } else {
        app.getView({
            ErrorMsg: Resource.msg('giftcertpurchase.checkinvalid', 'checkout', null)
        }).render('checkout/giftcert/giftcertpurchase');
    }

}


/**
 * Adds a gift certificate to the basket.
 * This is called when the giftcert.purchase form is posted in the giftcertpurchase.isml template.
 */
function addToBasket() {
    processAddToBasket(createGiftCert);
}

/**
 * Updates the gift certificate in the basket.
 * This is called when the giftcert.purchase is posted in the giftcertpurchase.isml template.
 */
function update() {
    processAddToBasket(updateGiftCert);
}

/**
 * Internal helper function that creates/updates the gift certificate.
 * Validates the giftcert.purchase form and handles any errors. Gets or
 * creates a CartModel and creates or updates the gift certificate line item.
 * It then recalculates the cart. For ajax requests, renders the checkout/giftcert/giftcertaddtobasketjson
 * template. For all other requests, calls the {@link module:controllers/Cart~show|Cart controller show function}.
 * @param {function} action The gift certificate function to execute.
 */
function processAddToBasket(action) {
    var purchaseForm = app.getForm('giftcert.purchase');

    // Validates confirmation of email address.
    var recipientEmailForm = purchaseForm.get('recipientEmail');
    var confirmRecipientEmailForm = purchaseForm.get('confirmRecipientEmail');

    if (recipientEmailForm.isValid() && confirmRecipientEmailForm.isValid() && (recipientEmailForm.value() !== confirmRecipientEmailForm.value())) {
        confirmRecipientEmailForm.invalidateFormElement('giftcert.confirmrecipientemailvalueerror');
    }

    // Validates amount in range.
    var amountForm = purchaseForm.get('amount');
    if (amountForm.isValid() && ((amountForm.value() < 5) || (amountForm.value() > 5000))) {
        amountForm.invalidateFormElement('giftcert.amountvalueerror');
    }

    // Extracts any error messages from validation.
    var formErrors = new HashMap();
    for (var i = 0; i < purchaseForm.object.getChildCount(); i++) {
        var field = purchaseForm.object[i];
        if (!field.isValid()) {
            formErrors.put(field.getHtmlName(), Resource.msg(field.getError(), 'forms', null));
        }
    }

    if (!formErrors.isEmpty()) {
        showError({
            FormErrors: formErrors
        });
        return;
    }

    var cart = Cart.goc();
    if (!cart) {
        showError({
            GeneralError: Resource.msg('checkout.giftcert.error.internal', 'checkout', null)
        });
        return;
    }

    var giftCertificateLineItem = action(cart);

    if (!giftCertificateLineItem) {
        showError({
            GeneralError: Resource.msg('checkout.giftcert.error.internal', 'checkout', null)
        });
        return;
    }

    Transaction.wrap(function () {
        cart.calculate();
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        app.getView({
            FormErrors: formErrors,
            GiftCertificateLineItem: giftCertificateLineItem
        }).render('checkout/giftcert/giftcertaddtobasketjson');
        return;
    }

    response.redirect(URLUtils.https('Cart-Show'));
}

/**
 * Gets the gift certificate line item and renders the minicart (checkout/cart/minicart) template.
 *
 * @TODO Check why normal minicart cannot be used
 */
function showMiniCart() {
    var cart = Cart.get();
    if (!cart) {
        return;
    }
    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(request.httpParameterMap.lineItemId.value);
    if (!giftCertificateLineItem) {
        return;
    }
    app.getView({
        Basket: cart.object,
        GiftCertificateLineItem: giftCertificateLineItem
    }).render('checkout/cart/minicart');
}

/**
 * Creates a gift certificate in the customer basket using form input values.
 * If a gift certificate is added to a product list, a ProductListItem is added, otherwise a GiftCertificateLineItem
 * is added.
 * __Note:__ the form must be validated before this function is called.
 *
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @return {dw.order.GiftCertificateLineItem} gift certificate line item added to the
 * current basket or product list.
 */
function createGiftCert(cart) {
    var giftCertificateLineItem;
    var productLineItemId = request.httpParameterMap.plid.stringValue;
    var productListItem = null;
    var purchaseForm = app.getForm('giftcert.purchase');

    if (productLineItemId) {
        var productList = ProductList.get(productLineItemId).object;
        if (productList) {
            productListItem = productList.getItem(purchaseForm.get('lineItemId').value());
        }
    }

    Transaction.wrap(function() {
        giftCertificateLineItem = cart.object.createGiftCertificateLineItem(purchaseForm.get('amount').value(), purchaseForm.get('recipientEmail').value())
        giftCertificateLineItem.setRecipientName(purchaseForm.get('recipient').value());
        giftCertificateLineItem.setSenderName(purchaseForm.get('from').value());
        giftCertificateLineItem.setMessage(purchaseForm.get('message').value());
        if (productListItem) {
            giftCertificateLineItem.setProductListItem(productListItem);
        }
        return giftCertificateLineItem;
    });

    if (!giftCertificateLineItem) {
        return null;
    }

    return giftCertificateLineItem;
}


/**
 * Updates a gift certificate in the customer basket using form input values.
 * Gets the input values from the purchase form and assigns them to the gift certificate line item.
 * __Note:__ the form must be validated before calling this function.
 *
 * @transaction
 * @param {module:models/CartModel~CartModel} cart - CartModel that wraps the current Basket.
 * @return {dw.order.GiftCertificateLineItem }gift certificate line item.
 */
function updateGiftCert(cart) {
    var purchaseForm = app.getForm('giftcert.purchase');

    var giftCertificateLineItem = cart.getGiftCertificateLineItemByUUID(purchaseForm.get('lineItemId').value());
    if (!giftCertificateLineItem) {
        return null;
    }

    Transaction.begin();

    giftCertificateLineItem.senderName = purchaseForm.get('from').value();
    giftCertificateLineItem.recipientName = purchaseForm.get('recipient').value();
    giftCertificateLineItem.recipientEmail = purchaseForm.get('recipientEmail').value();
    giftCertificateLineItem.message = purchaseForm.get('message').value();

    var amount = purchaseForm.get('amount').value();
    giftCertificateLineItem.basePrice = new Money(amount, giftCertificateLineItem.basePrice.currencyCode);
    giftCertificateLineItem.grossPrice = new Money(amount, giftCertificateLineItem.grossPrice.currencyCode);
    giftCertificateLineItem.netPrice = new Money(amount, giftCertificateLineItem.netPrice.currencyCode);

    Transaction.commit();

    return giftCertificateLineItem;
}

/*
 * Web exposed methods
 */
/** Renders the page to purchase a gift certificate.
 * @see module:controllers/GiftCert~purchase */
exports.Purchase        = guard.ensure(['https','get'],purchase);
/** Updates and renders the gift certificate purchase page.
 * @see module:controllers/GiftCert~edit */
exports.Edit            = guard.ensure(['https','get'],edit);
/** Displays the details of a gift certificate to check the current balance.
 * @see module:controllers/GiftCert~checkBalance */
exports.CheckBalance    = guard.ensure(['https','post'],checkBalance);
/** Adds a gift certificate to the basket.
 * @see module:controllers/GiftCert~addToBasket */
exports.AddToBasket     = guard.ensure(['https','post'],addToBasket);
/** Updates the gift certificate in the basket.
 * @see module:controllers/GiftCert~update */
exports.Update          = guard.ensure(['https','post'],update);
/** Renders the minicart.
 * @see module:controllers/GiftCert~showMiniCart */
exports.ShowMiniCart    = guard.ensure(['https','get'],showMiniCart);
