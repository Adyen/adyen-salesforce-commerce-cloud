'use strict';

/**
 * This controller updates the current session currency.
 *
 * @module controllers/Currency
 */

/* API Includes */
var Currency = require('dw/util/Currency');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var Cart = require('~/cartridge/scripts/models/CartModel');

/**
 * This controller is used in an AJAX call to set the session variable 'currency'.
 */
function setSessionCurrency() {
    var currencyMnemonic = request.httpParameterMap.currencyMnemonic.value;
    var Response = require('~/cartridge/scripts/util/Response');
    var currency;

    if (currencyMnemonic) {
        currency = Currency.getCurrency(currencyMnemonic);
        if (currency) {
            session.setCurrency(currency);

            Transaction.wrap(function () {
                var currentCart = Cart.get();
                if (currentCart) {
                    currentCart.calculate();
                }
            });
        }
    }

    Response.renderJSON({
        success: true
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/Currency~setSessionCurrency */
exports.SetSessionCurrency = guard.ensure(['get'], setSessionCurrency);
