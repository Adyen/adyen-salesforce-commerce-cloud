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
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const URLUtils = require('dw/web/URLUtils');
const AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
const RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
const adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');
const constants = require('*/cartridge/adyenConstants/constants');

function createSession(basket, customer, countryCode) {
  try {
    const service = AdyenHelper.getService(
        constants.SERVICE.SESSIONS
    );
    if (!service) {
      throw new Error('Could not do /sessions call');
    }

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
      }
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

    sessionsRequest.blockedPaymentMethods = AdyenHelper.BLOCKED_PAYMENT_METHODS;

    const xapikey = AdyenConfigs.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);

    const callResult = service.call(JSON.stringify(sessionsRequest));
    if (!callResult.isOk()) {
      throw new Error(
          `/paymentMethods call error code${callResult
              .getError()
              .toString()} Error => ResponseStatus: ${callResult.getStatus()} | ResponseErrorText: ${callResult.getErrorMessage()} | ResponseText: ${callResult.getMsg()}`,
      );
    }

    const resultObject = callResult.object;
    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from /sessions call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').fatal(
        `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  createSession,
};
