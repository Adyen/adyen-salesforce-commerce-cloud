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
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');

function donate(donationReference, donationAmount, originalReference) {
  try {
    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      modificationAmount: donationAmount,
      reference: `${AdyenConfigs.getAdyenMerchantAccount()}-${donationReference}`,
      originalReference,
    };

    const response = AdyenHelper.executeCall(constants.SERVICE.ADYENGIVING, requestObject);

    Transaction.wrap(() => {
      const order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return response;
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  donate,
};
