/**
 * Gets recurring payment list from Adyen
 *
 * @input Customer : dw.customer.Customer
 *
 */

/* API Includes */
const Logger = require('dw/system/Logger');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function getOriginKey(origin) {
  try {
    const requestObject = {};
    const service = AdyenHelper.getService(AdyenHelper.SERVICE.ORIGINKEYS);

    if (!service) {
      throw new Error('Could not do /originKeys call');
    }

    const domain = [];
    domain.push(origin);
    requestObject.originDomains = domain;

    const xapikey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    const callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error(
        `/originKeys Call error code${
          callResult.getError().toString()
        } Error => ResponseStatus: ${
          callResult.getStatus()
        } | ResponseErrorText: ${
          callResult.getErrorMessage()
        } | ResponseText: ${
          callResult.getMsg()}`,
      );
    }

    const resultObject = callResult.object;
    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from /originKeys call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').fatal(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

function getOriginKeyFromRequest(protocol, host) {
  const origin = `${protocol}://${host}`;
  const originKeysResponse = getOriginKey(origin);

  return originKeysResponse.originKeys[origin];
}

module.exports = {
  getOriginKey: getOriginKey,
  getOriginKeyFromRequest: getOriginKeyFromRequest,
};
