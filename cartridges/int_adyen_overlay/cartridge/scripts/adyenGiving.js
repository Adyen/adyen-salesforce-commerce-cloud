"use strict";

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
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Make a donation to Adyen giving
 */
// script include
var Logger = require('dw/system/Logger');

var OrderMgr = require('dw/order/OrderMgr');

var Transaction = require('dw/system/Transaction');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var constants = require('*/cartridge/adyenConstants/constants');

function donate(donationReference, donationAmount, originalReference) {
  try {
    var service = AdyenHelper.getService(constants.SERVICE.ADYENGIVING);

    if (!service) {
      throw new Error('Could not connect to Adyen Giving');
    }

    var requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      modificationAmount: donationAmount,
      reference: "".concat(AdyenConfigs.getAdyenMerchantAccount(), "-").concat(donationReference),
      originalReference: originalReference
    };
    var xapikey = AdyenConfigs.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    var callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error("Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }

    var resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from adyenGiving call');
    }

    Transaction.wrap(function () {
      var order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').error("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}

module.exports = {
  donate: donate
};