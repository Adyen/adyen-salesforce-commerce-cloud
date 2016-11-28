'use strict';

/**
 * Controller that adds and removes products and coupons in the cart.
 * Also provides functions for the continue shopping button and minicart.
 *
 * @module controllers/Cart
 */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var ISML = require('dw/template/ISML');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Redirects the user to the last visited catalog URL if known, otherwise redirects to
 * a hostname-only URL if an alias is set, or to the Home-Show controller function in the default
 * format using the HTTP protocol.
 */
function continueShopping() {

    var location = require('~/cartridge/scripts/util/Browsing').lastCatalogURL();

    if (location) {
        response.redirect(location);
    } else {
        response.redirect(URLUtils.httpHome());
    }
}

/**
 * Invalidates the login and shipment forms. Renders the checkout/cart/cart template.
 */
function show() {
    var cartForm = app.getForm('cart');
    app.getForm('login').invalidate();

    cartForm.get('shipments').invalidate();

    app.getView('Cart', {
        cart: app.getModel('Cart').get(),
        RegistrationStatus: false
    }).render('checkout/cart/cart');

}

/**
 * Handles the form actions for the cart.
 * - __addCoupon(formgroup)__ - adds a coupon to the basket in a transaction. Returns a JSON object with parameters for the template.
 * - __calculateTotal__ - returns the cart object.
 * - __checkoutCart__ - validates the cart for checkout. If valid, redirect to the COCustomer-Start controller function to start the checkout. If invalid returns the cart and the results of the validation.
 * - __continueShopping__ - calls the {@link module:controllers/Cart~continueShopping|continueShopping} function and returns null.
 * - __deleteCoupon(formgroup)__ - removes a coupon from the basket in a transaction. Returns a JSON object with parameters for the template
 * - __deleteGiftCertificate(formgroup)__ - removes a gift certificate from the basket in a transaction. Returns a JSON object with parameters for the template.
 * - __deleteProduct(formgroup)__ -  removes a product from the basket in a transaction. Returns a JSON object with parameters for the template.
 * - __editLineItem(formgroup)__ - gets a ProductModel that wraps the pid (product ID) in the httpParameterMap and updates the options to select for the product. Updates the product in a transaction.
 * Renders the checkout/cart/refreshcart template. Returns null.
 * - __login__ - calls the Login controller and returns a JSON object with parameters for the template.
 * - __logout__ - logs the customer out and returns a JSON object with parameters for the template.
 * - __register__ - calls the Account controller StartRegister function. Updates the cart calculation in a transaction and returns null.
 * - __unregistered__ - calls the COShipping controller Start function and returns null.
 * - __updateCart__ - In a transaction, removes zero quantity line items, removes line items for in-store pickup, and copies data to system objects based on the form bindings.
 * Returns a JSON object with parameters for the template.
 * - __error__ - returns null.
 *
 * __Note:__ The CartView sets the ContinueURL to this function, so that any time URLUtils.continueURL() is used in the cart.isml, this function is called.
 * Several actions have <b>formgroup</b> as an input parameter. The formgroup is supplied by the {@link module:models/FormModel~FormModel/handleAction|FormModel handleAction} function in the FormModel module.
 * The formgroup is session.forms.cart object of the triggered action in the form definition. Any object returned by the function for an action is passed in the parameters to the cart template
 * and is accessible using the $pdict.property syntax. For example, if a function returns {CouponStatus: status} is accessible via ${pdict.CouponStatus}
 * Most member functions return a JSON object that contains {cart: cart}. The cart property is used by the CartView to determine the value of
 * $pdict.Basket in the cart.isml template.
 *
 * For any member function that returns an object, the page metadata is updated, the function gets a ContentModel that wraps the cart content asset,
 * and the checkout/cart/cart template is rendered.
 *
 */
function submitForm() {
    // There is no existing state, so resolve the basket again.
    var cart, formResult, cartForm, cartAsset, pageMeta;
    cartForm = app.getForm('cart');
    cart = app.getModel('Cart').goc();

    formResult = cartForm.handleAction({
        //Add a coupon if a coupon was entered correctly and is active.
        'addCoupon': function (formgroup) {
            var CSRFProtection = require('dw/web/CSRFProtection');

            if (!CSRFProtection.validateRequest()) {
                app.getModel('Customer').logout();
                app.getView().render('csrf/csrffailed');
                return null;
            }

            var status;
            var result = {
                cart: cart,
                EnableCheckout: true,
                dontRedirect: true
            };

            if (formgroup.couponCode.htmlValue) {
                status = cart.addCoupon(formgroup.couponCode.htmlValue);

                if (status) {
                    // if a status is returned, set the error state based on whether or not it was applied
                    var statusError = (status.CouponStatus != 'APPLIED');

                    result.dontRedirect = statusError;
                    result.CouponStatus = {
                        code: status.CouponStatus,
                        error: statusError
                    };
                } else {
                    // no status means valid but inactive coupon
                    result.CouponError = 'NO_ACTIVE_PROMOTION';
                }
            } else {
                // no coupon code supplied
                result.CouponError = 'COUPON_CODE_MISSING';
            }
            return result;
        },
        'calculateTotal': function () {
            // Nothing to do here as re-calculation happens during view anyways
            return {
                cart: cart
            };
        },
        'checkoutCart': function () {
            var validationResult, result;

            validationResult = cart.validateForCheckout();

            if (validationResult.EnableCheckout) {
                //app.getController('COCustomer').Start();
                response.redirect(URLUtils.https('COCustomer-Start'));

            } else {
                result = {
                    cart: cart,
                    BasketStatus: validationResult.BasketStatus,
                    EnableCheckout: validationResult.EnableCheckout
                };
            }
            return result;
        },
        'continueShopping': function () {
            continueShopping();
            return null;
        },
        'deleteCoupon': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeCouponLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'deleteGiftCertificate': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeGiftCertificateLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'deleteProduct': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeProductLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'editLineItem': function (formgroup) {
            var product, productOptionModel;
            product = app.getModel('Product').get(request.httpParameterMap.pid.stringValue).object;
            productOptionModel = product.updateOptionSelection(request.httpParameterMap);

            Transaction.wrap(function () {
                cart.updateLineItem(formgroup.getTriggeredAction().object, product, request.httpParameterMap.Quantity.doubleValue, productOptionModel);
                cart.calculate();
            });

            ISML.renderTemplate('checkout/cart/refreshcart');
            return null;
        },
        'updateCart': function () {

            Transaction.wrap(function () {
                var shipmentItem, item;

                // remove zero quantity line items
                for (var i = 0; i < session.forms.cart.shipments.childCount; i++) {
                    shipmentItem = session.forms.cart.shipments[i];

                    for (var j = 0; j < shipmentItem.items.childCount; j++) {
                        item = shipmentItem.items[j];

                        if (item.quantity.value === 0) {
                            cart.removeProductLineItem(item.object);
                        }
                    }
                }

                session.forms.cart.shipments.accept();
                cart.checkInStoreProducts();
            });

            return {
                cart: cart,
                EnableCheckout: true
            };
        },
        'error': function () {
            return null;
        }
    });

    if (formResult) {
        cartAsset = app.getModel('Content').get('cart');

        pageMeta = require('~/cartridge/scripts/meta');
        pageMeta.update(cartAsset);

        if (formResult.dontRedirect) {
            app.getView({
                Basket: formResult.cart.object,
                EnableCheckout: formResult.EnableCheckout,
                CouponStatus: formResult.CouponStatus,
                CouponError: formResult.CouponError
            }).render('checkout/cart/cart');
        } else {
            response.redirect(URLUtils.https('Cart-Show'));
        }
    }
}

/**
 * Adds or replaces a product in the cart, gift registry, or wishlist.
 * If the function is being called as a gift registry update, calls the
 * {@link module:controllers/GiftRegistry~replaceProductListItem|GiftRegistry controller ReplaceProductListItem function}.
 * The httpParameterMap source and cartAction parameters indicate how the function is called.
 * If the function is being called as a wishlist update, calls the
 * {@link module:controllers/Wishlist~replaceProductListItem|Wishlist controller ReplaceProductListItem function}.
 * If the product line item for the product to add has a:
 * - __uuid__ - gets a ProductModel that wraps the product and determines the product quantity and options.
 * In a transaction, calls the {@link module:models/CartModel~CartModel/updateLineItem|CartModel updateLineItem} function to replace the current product in the line
 * item with the new product.
 * - __plid__ - gets the product list and adds a product list item.
 * Otherwise, adds the product and checks if a new discount line item is triggered.
 * Renders the checkout/cart/refreshcart template if the httpParameterMap format parameter is set to ajax,
 * otherwise renders the checkout/cart/cart template.
 */
function addProduct() {
    var cart = app.getModel('Cart').goc();
    var renderInfo = cart.addProductToCart();

    if (renderInfo.source === 'giftregistry') {
        app.getView().render('account/giftregistry/refreshgiftregistry');
    } else if (renderInfo.template === 'checkout/cart/cart') {
        app.getView('Cart', {
            Basket: cart
        }).render(renderInfo.template);
    } else if (renderInfo.format === 'ajax') {
        app.getView('Cart', {
            cart: cart,
            BonusDiscountLineItem: renderInfo.BonusDiscountLineItem
        }).render(renderInfo.template);
    } else {
        response.redirect(URLUtils.url('Cart-Show'));
    }
}

/**
 * Displays the current items in the cart in the minicart panel.
 */
function miniCart() {

    var cart = app.getModel('Cart').get();
    app.getView({
        Basket: cart ? cart.object : null
    }).render('checkout/cart/minicart');

}

/**
 * Adds the product with the given ID to the wish list.
 *
 * Gets a ProductModel that wraps the product in the httpParameterMap. Uses
 * {@link module:models/ProductModel~ProductModel/updateOptionSelection|ProductModel updateOptionSelection}
 * to get the product options selected for the product.
 * Gets a ProductListModel and adds the product to the product list. Renders the checkout/cart/cart template.
 */
function addToWishlist() {
    var productID, product, productOptionModel, productList, Product;
    Product = app.getModel('Product');

    productID = request.httpParameterMap.pid.stringValue;
    product = Product.get(productID);
    productOptionModel = product.updateOptionSelection(request.httpParameterMap);

    productList = app.getModel('ProductList').get();
    productList.addProduct(product.object, request.httpParameterMap.Quantity.doubleValue, productOptionModel);

    app.getView('Cart', {
        cart: app.getModel('Cart').get(),
        ProductAddedToWishlist: productID
    }).render('checkout/cart/cart');

}

/**
 * Adds a bonus product to the cart.
 *
 * Parses the httpParameterMap and adds the bonus products in it to an array.
 *
 * Gets the bonus discount line item. In a transaction, removes the bonus discount line item. For each bonus product in the array,
 * gets the product based on the product ID and adds the product as a bonus product to the cart.
 *
 * If the product is a bundle, updates the product option selections for each child product, finds the line item,
 * and replaces it with the current child product and selections.
 *
 * If the product and line item can be retrieved, recalculates the cart, commits the transaction, and renders a JSON object indicating success.
 * If the transaction fails, rolls back the transaction and renders a JSON object indicating failure.
 */
function addBonusProductJson() {
    var h, i, j, cart, data, productsJSON, bonusDiscountLineItem, product, lineItem, childPids, childProduct, foundLineItem, Product;
    cart = app.getModel('Cart').goc();
    Product = app.getModel('Product');

    // parse bonus product JSON
    data = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
    productsJSON = new ArrayList();

    for (h = 0; h < data.bonusproducts.length; h += 1) {
        // add bonus product at index zero (front of the array) each time
        productsJSON.addAt(0, data.bonusproducts[h].product);
    }

    bonusDiscountLineItem = cart.getBonusDiscountLineItemByUUID(request.httpParameterMap.bonusDiscountLineItemUUID.stringValue);

    Transaction.begin();
    cart.removeBonusDiscountLineItemProducts(bonusDiscountLineItem);

    for (i = 0; i < productsJSON.length; i += 1) {

        product = Product.get(productsJSON[i].pid).object;
        lineItem = cart.addBonusProduct(bonusDiscountLineItem, product, new ArrayList(productsJSON[i].options), parseInt(productsJSON[i].qty));

        if (lineItem && product) {
            if (product.isBundle()) {

                childPids = productsJSON[i].childPids.split(',');

                for (j = 0; j < childPids.length; j += 1) {
                    childProduct = Product.get(childPids[j]).object;

                    if (childProduct) {

                        // TODO: CommonJSify cart/UpdateProductOptionSelections.ds and import here

                        var UpdateProductOptionSelections = require('app_storefront_core/cartridge/scripts/cart/UpdateProductOptionSelections');
                        UpdateProductOptionSelections.update({
                            SelectedOptions: new ArrayList(productsJSON[i].options),
                            Product: childProduct
                        });

                        foundLineItem = cart.getBundledProductLineItemByPID(lineItem.getBundledProductLineItems(),
                            (childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID));

                        if (foundLineItem) {
                            foundLineItem.replaceProduct(childProduct);
                        }
                    }
                }
            }
        } else {
            Transaction.rollback();

            let r = require('~/cartridge/scripts/util/Response');
            r.renderJSON({
                success: false
            });
            return;
        }
    }

    cart.calculate();
    Transaction.commit();

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON({
        success: true
    });
}

/**
 * Adds a coupon to the cart using JSON.
 *
 * Gets the CartModel. Gets the coupon code from the httpParameterMap couponCode parameter.
 * In a transaction, adds the coupon to the cart and renders a JSON object that includes the coupon code
 * and the status of the transaction.
 *
 */
function addCouponJson() {
    var couponCode, cart, couponStatus;

    couponCode = request.httpParameterMap.couponCode.stringValue;
    cart = app.getModel('Cart').goc();

    Transaction.wrap(function () {
        couponStatus = cart.addCoupon(couponCode);
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        let r = require('~/cartridge/scripts/util/Response');
        r.renderJSON({
            status: couponStatus.code,
            message: Resource.msgf('cart.' + couponStatus.code, 'checkout', null, couponCode),
            success: !couponStatus.error,
            baskettotal: cart.object.adjustedMerchandizeTotalGrossPrice.value,
            CouponCode: couponCode
        });
    }
}

/*
* Module exports
*/

/*
* Exposed methods.
*/
/** Adds a product to the cart.
 * @see {@link module:controllers/Cart~addProduct} */
exports.AddProduct = guard.ensure(['post'], addProduct);
/** Invalidates the login and shipment forms. Renders the basket content.
 * @see {@link module:controllers/Cart~show} */
exports.Show = guard.ensure(['https'], show);
/** Form handler for the cart form.
 * @see {@link module:controllers/Cart~submitForm} */
exports.SubmitForm = guard.ensure(['post', 'https'], submitForm);
/** Redirects the user to the last visited catalog URL.
 * @see {@link module:controllers/Cart~continueShopping} */
exports.ContinueShopping = guard.ensure(['https'], continueShopping);
/** Adds a coupon to the cart using JSON. Called during checkout.
 * @see {@link module:controllers/Cart~addCouponJson} */
exports.AddCouponJson = guard.ensure(['get', 'https'], addCouponJson);
/** Displays the current items in the cart in the minicart panel.
 * @see {@link module:controllers/Cart~miniCart} */
exports.MiniCart = guard.ensure(['get'], miniCart);
/** Adds the product with the given ID to the wish list.
 * @see {@link module:controllers/Cart~addToWishlist} */
exports.AddToWishlist = guard.ensure(['get', 'https', 'loggedIn'], addToWishlist, {
    scope: 'wishlist'
});
/** Adds bonus product to cart.
 * @see {@link module:controllers/Cart~addBonusProductJson} */
exports.AddBonusProduct = guard.ensure(['post'], addBonusProductJson);
