'use strict';

/**
 * Controller that reports to the Salesforce Commerce Cloud A/B test engine when a customer starts
 * checkout in the storefront. This event is recorded only for the purposes of updating A/B test statistics and
 * does not affect the basket. This controller does not ordinarily need to be customized.
 *
 * @module controllers/ABTestEvent
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Gets a CartModel object that wraps a Basket object. Registers a "start checkout" event for the specified basket.
 * This event is tracked for A/B test statistics but otherwise has no effect on the basket.
 * The system registers at most one checkout per basket per session.
 */
function startCheckout() {
    var cart = app.getModel('Cart').get();

    if (cart) {
        cart.object.startCheckout();
        app.getView().render('util/reporting/reporting');
    } else {
        app.getView().render('util/reporting/reporting');
    }
}

/*
* Module exports
*/

/*
* Web exposed methods
*/
/**
 * Registers the 'start checkout' event for A/B testing.
 * You must use GET to access the function via URL.
 * @see module:controllers/ABTestEvent~startCheckout
 */
exports.StartCheckout = guard.ensure(['get'], startCheckout);
