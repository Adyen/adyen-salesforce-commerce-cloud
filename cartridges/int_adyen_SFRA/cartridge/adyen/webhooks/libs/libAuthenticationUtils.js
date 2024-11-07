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
 * Script use to handle authentications for different Adyen (in) calls
 */

var StringUtils = require('dw/util/StringUtils');
var Encoding = require('dw/crypto/Encoding');
var Mac = require('dw/crypto/Mac');
var Bytes = require('dw/util/Bytes');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

/**
 *
 * @function Checks the Basic Authentication header agains the give user and password combination
 * @param baHeader The Basic Authentication header
 * @param baUser The Basic Authentication user
 * @param baPassword The basic Authentication password
 */
function checkGivenCredentials(baHeader, baUser, baPassword) {
  var basicPrefix = 'Basic';
  if (baHeader && baHeader.indexOf(basicPrefix) === 0) {
    // Authorization: Basic base64credentials
    var base64Credentials = baHeader.substring(basicPrefix.length).trim();
    var credentials = StringUtils.decodeBase64(base64Credentials);
    // credentials = username:password
    var values = credentials.split(':', 2);
    return values[0] === baUser && values[1] === baPassword;
  }
  return false;
}
function constructPayload(notificationData) {
  var signedDataList = [];
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
    var hmacKey = Encoding.fromHex(new Bytes(AdyenConfigs.getAdyenHmacKey(), 'UTF-8'));
    var payload = constructPayload(request.form);
    var macSHA256 = new Mac(Mac.HMAC_SHA_256);
    var merchantSignature = Encoding.toBase64(macSHA256.digest(payload, hmacKey));
    return merchantSignature;
  } catch (error) {
    AdyenLogs.fatal_log('Cannot calculate HMAC signature', error);
    return {
      error: true
    };
  }
}
module.exports = {
  checkGivenCredentials: checkGivenCredentials,
  calculateHmacSignature: calculateHmacSignature
};