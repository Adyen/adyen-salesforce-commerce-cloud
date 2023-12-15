"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var URLUtils = require('dw/web/URLUtils');
var AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
var adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');
var constants = require('*/cartridge/adyenConstants/constants');
var blockedPayments = require('*/cartridge/scripts/config/blockedPaymentMethods.json');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function createSession(basket, customer, countryCode) {
  try {
    var sessionsRequest = {};

    // There is no basket for myAccount session requests
    if (basket) {
      var getRemainingAmount = function getRemainingAmount(giftCardResponse) {
        if (giftCardResponse && JSON.parse(giftCardResponse).remainingAmount) {
          return JSON.parse(giftCardResponse).remainingAmount;
        }
        return {
          currency: basket.currencyCode,
          value: AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()).value
        };
      };
      var amount = getRemainingAmount(session.privacy.giftCardResponse);

      //TODO: Change AdyenHelper so that this object can have a different name. Not creating a payment request here
      var paymentRequest = {
        merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
        amount: amount
      };

      // Add Risk data
      if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
        paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(basket);
      }

      // L2/3 Data
      if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
        paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems({
          Basket: basket
        }));
      }

      // Create shopper data fields
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
    }

    // This is not yet used. A valid URl to ShowConfirmation requires an order number, which we do not yet have.
    sessionsRequest.returnUrl = URLUtils.url('Checkout-Begin', 'stage', 'placeOrder').toString();

    // check logged in shopper for oneClick
    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;
    var customerID = null;
    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }
    if (customerID) {
      sessionsRequest.shopperReference = customerID;
    }
    sessionsRequest.blockedPaymentMethods = blockedPayments.blockedPaymentMethods;
    var platformVersion = AdyenHelper.getApplicationInfo().externalPlatform.version;
    var service = platformVersion === constants.PLATFORMS.SG ? "".concat(constants.SERVICE.SESSIONS).concat(constants.PLATFORMS.SG) : constants.SERVICE.SESSIONS;
    return AdyenHelper.executeCall(service, sessionsRequest);
  } catch (e) {
    AdyenLogs.fatal_log("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}
module.exports = {
  createSession: createSession
};