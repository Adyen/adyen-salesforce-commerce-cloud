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
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function donate(donationReference, donationAmount, originalReference) {
  try {
    var requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      modificationAmount: donationAmount,
      reference: "".concat(AdyenConfigs.getAdyenMerchantAccount(), "-").concat(donationReference),
      originalReference: originalReference
    };
    var response = AdyenHelper.executeCall(constants.SERVICE.ADYENGIVING, requestObject);
    Transaction.wrap(function () {
      var order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return response;
  } catch (e) {
    AdyenLogs.error_log("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}
module.exports = {
  donate: donate
};