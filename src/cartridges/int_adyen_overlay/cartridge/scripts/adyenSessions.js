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
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const URLUtils = require('dw/web/URLUtils');
const AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
const RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
const adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');
const constants = require('*/cartridge/adyenConstants/constants');
const blockedPayments = require('*/cartridge/scripts/config/blockedPaymentMethods.json');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function createSession(basket, customer, countryCode) {
  try {

    let sessionsRequest = {};

    // There is no basket for myAccount session requests
    if(basket) {
      //TODO: Change AdyenHelper so that this object can have a different name. Not creating a payment request here
      let paymentRequest = {
        merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
        amount: {
          currency: basket.currencyCode,
          value: AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()).value,
        },
      };

      // Add Risk data
        if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
          paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(
              basket
          );
        }

        // L2/3 Data
        if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
          paymentRequest.additionalData = { ...paymentRequest.additionalData, ...adyenLevelTwoThreeData.getLineItems({Basket: basket}) };
        }

        // Create shopper data fields
        sessionsRequest = AdyenHelper.createShopperObject({
          order: basket,
          paymentRequest,
        });

        sessionsRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems({Basket: basket});
        sessionsRequest.reference = basket.getUUID();
    } else {
      // if there is no basket we only retrieve 'scheme' for zeroAuth
      sessionsRequest = {
        merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
        allowedPaymentMethods: ['scheme'],
        reference: 'no_basket',
        amount: {
          currency: session.currency.currencyCode,
          value: 0,
        },
      };
    }

    if (countryCode) {
      sessionsRequest.countryCode = countryCode;
    }

    if(request.getLocale()){
      sessionsRequest.shopperLocale = request.getLocale();
    }

    // This is not yet used. A valid URl to ShowConfirmation requires an order number, which we do not yet have.
    sessionsRequest.returnUrl = URLUtils.url('Checkout-Begin', 'stage', 'placeOrder').toString();

    // check logged in shopper for oneClick
    const profile =
        customer && customer.registered && customer.getProfile()
            ? customer.getProfile()
            : null;
    let customerID = null;
    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }
    if (customerID) {
      sessionsRequest.shopperReference = customerID;
    }

    sessionsRequest.blockedPaymentMethods = blockedPayments.blockedPaymentMethods;

    return AdyenHelper.executeCall(constants.SERVICE.SESSIONS, sessionsRequest); 
  } catch (e) {
    AdyenLogs.fatal_log(
        `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  createSession,
};
