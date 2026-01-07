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
 * Script use to handle authentications for different Adyen (in) calls
 */

const StringUtils = require('dw/util/StringUtils');
const Encoding = require('dw/crypto/Encoding');
const Mac = require('dw/crypto/Mac');
const Bytes = require('dw/util/Bytes');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

/**
 *
 * @function Checks the Basic Authentication header agains the give user and password combination
 * @param baHeader The Basic Authentication header
 * @param baUser The Basic Authentication user
 * @param baPassword The basic Authentication password
 */
function checkGivenCredentials(baHeader, baUser, baPassword) {
  const basicPrefix = 'Basic';
  if (baHeader && baHeader.indexOf(basicPrefix) === 0) {
    // Authorization: Basic base64credentials
    const base64Credentials = baHeader.substring(basicPrefix.length).trim();
    const credentials = StringUtils.decodeBase64(base64Credentials);
    // credentials = username:password
    const values = credentials.split(':', 2);

    return values[0] === baUser && values[1] === baPassword;
  }
  return false;
}

function constructPayload(notificationData) {
  const signedDataList = [];
  signedDataList.push(notificationData.pspReference);
  signedDataList.push(notificationData.originalReference);
  signedDataList.push(notificationData.merchantAccountCode);
  signedDataList.push(notificationData.merchantReference);
  signedDataList.push(notificationData.value);
  signedDataList.push(notificationData.currency);
  signedDataList.push(notificationData.eventCode);
  signedDataList.push(notificationData.success);
  return signedDataList.join(constants.NOTIFICATION_PAYLOAD_DATA_SEPARATOR);
}

function calculateHmacSignature(request) {
  try {
    const hmacKey = Encoding.fromHex(
      new Bytes(AdyenConfigs.getAdyenHmacKey(), 'UTF-8'),
    );
    const payload = constructPayload(request.form);
    const macSHA256 = new Mac(Mac.HMAC_SHA_256);
    const merchantSignature = Encoding.toBase64(
      macSHA256.digest(payload, hmacKey),
    );
    return merchantSignature;
  } catch (error) {
    AdyenLogs.fatal_log('Cannot calculate HMAC signature', error);
    return { error: true };
  }
}

module.exports = {
  checkGivenCredentials,
  calculateHmacSignature,
};
