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
const URLUtils = require('dw/web/URLUtils');
const AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
const RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
const adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');

function createSession(basket, customer, countryCode) {
  try {
    const service = AdyenHelper.getService(
        AdyenHelper.SERVICE.SESSIONS
    );
    if (!service) {
      throw new Error('Could not do /sessions call');
    }

    const paymentAmount = AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice());
    const currencyCode = basket.currencyCode;

    //TODO: Change AdyenHelper so that this object can have a different name. Not creating a payment request here
    let paymentRequest = {
      merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
      amount: {
        currency: currencyCode,
        value: paymentAmount.value,
      },
    };

    // Add Risk data
    if (AdyenHelper.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(
          basket
      );
    }

    // L2/3 Data
    if (AdyenHelper.getAdyenLevel23DataEnabled()) {
      paymentRequest.additionalData = { ...paymentRequest.additionalData, ...adyenLevelTwoThreeData.getLineItems({Basket: basket}) };
    }

    // Create shopper data fields
    const sessionsRequest = AdyenHelper.createShopperObject({
      order: basket,
      paymentRequest,
    });

    if (countryCode) {
      sessionsRequest.countryCode = countryCode;
    }

    if(request.getLocale()){
      sessionsRequest.shopperLocale = request.getLocale();
    }

    sessionsRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems({Basket: basket});
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

    sessionsRequest.reference = basket.getUUID();
    sessionsRequest.blockedPaymentMethods = AdyenHelper.BLOCKED_PAYMENT_METHODS;

    const xapikey = AdyenHelper.getAdyenApiKey();
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
