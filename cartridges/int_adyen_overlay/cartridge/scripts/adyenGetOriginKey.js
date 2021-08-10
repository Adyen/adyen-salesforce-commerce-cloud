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
 * Gets recurring payment list from Adyen
 */

/* API Includes */
var Logger = require('dw/system/Logger');
/* Script Modules */


var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function getOriginKey(origin) {
  try {
    var requestObject = {};
    var service = AdyenHelper.getService(AdyenHelper.SERVICE.ORIGINKEYS);

    if (!service) {
      throw new Error('Could not do /originKeys call');
    }

    var domain = [];
    domain.push(origin);
    requestObject.originDomains = domain;
    var xapikey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    var callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error("/originKeys Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }

    var resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from /originKeys call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').error("It seems your API key is incorrect ... Please make sure API key is configured");
    Logger.getLogger('Adyen').fatal("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}

function getOriginKeyFromRequest(protocol, host) {
  var origin = "".concat(protocol, "://").concat(host);
  var originKeysResponse = getOriginKey(origin);
  return originKeysResponse.originKeys[origin];
}

module.exports = {
  getOriginKey: getOriginKey,
  getOriginKeyFromRequest: getOriginKeyFromRequest
};