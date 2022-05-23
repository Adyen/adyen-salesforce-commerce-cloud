"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2022 Adyen N.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Send request to adyen to create a checkout session
 */
// script include
var Logger = require('dw/system/Logger');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var URLUtils = require('dw/web/URLUtils');

var AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');

var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');

var adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');

var constants = require('*/cartridge/adyenConstants/constants');

function createSession(basket, customer, countryCode) {
  try {
    var service = AdyenHelper.getService(constants.SERVICE.SESSIONS);

    if (!service) {
      throw new Error('Could not do /sessions call');
    }

    var sessionsRequest = {}; // There is no basket for myAccount session requests

    if (basket) {
      //TODO: Change AdyenHelper so that this object can have a different name. Not creating a payment request here
      var paymentRequest = {
        merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
        amount: {
          currency: basket.currencyCode,
          value: AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()).value
        }
      }; // Add Risk data

      if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
        paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(basket);
      } // L2/3 Data


      if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
        paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems({
          Basket: basket
        }));
      } // Create shopper data fields


      sessionsRequest = AdyenHelper.createShopperObject({
        order: basket,
        paymentRequest: paymentRequest
      });
      sessionsRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems({
        Basket: basket
      });
      sessionsRequest.reference = basket.getUUID();
    } else {
      // if there is no basket we only retrieve 'scheme' for zeroAuth
      sessionsRequest = {
        merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
        allowedPaymentMethods: ['scheme'],
        reference: 'no_basket',
        amount: {
          currency: session.currency.currencyCode,
          value: 0
        }
      };
    }

    if (countryCode) {
      sessionsRequest.countryCode = countryCode;
    }

    if (request.getLocale()) {
      sessionsRequest.shopperLocale = request.getLocale();
    } // This is not yet used. A valid URl to ShowConfirmation requires an order number, which we do not yet have.


    sessionsRequest.returnUrl = URLUtils.url('Checkout-Begin', 'stage', 'placeOrder').toString(); // check logged in shopper for oneClick

    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;
    var customerID = null;

    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }

    if (customerID) {
      sessionsRequest.shopperReference = customerID;
    }

    sessionsRequest.blockedPaymentMethods = AdyenHelper.BLOCKED_PAYMENT_METHODS;
    var xapikey = AdyenConfigs.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    var callResult = service.call(JSON.stringify(sessionsRequest));

    if (!callResult.isOk()) {
      throw new Error("/paymentMethods call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }

    var resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from /sessions call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').fatal("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}

module.exports = {
  createSession: createSession
};