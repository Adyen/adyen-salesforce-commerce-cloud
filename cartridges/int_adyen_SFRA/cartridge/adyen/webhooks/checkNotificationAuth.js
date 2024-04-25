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
 *  Script used to authentication notification calls from Adyen
 */
var Site = require('dw/system/Site');
var AuthenticationUtils = require('*/cartridge/adyen/webhooks/libs/libAuthenticationUtils');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function check(request) {
  var baUser = Site.getCurrent().getCustomPreferenceValue('Adyen_notification_user');
  var baPassword = Site.getCurrent().getCustomPreferenceValue('Adyen_notification_password');
  var baHeader = request.httpHeaders.authorization;
  if (!(baUser && baPassword && baHeader)) {
    return false;
  }
  return AuthenticationUtils.checkGivenCredentials(baHeader, baUser, baPassword);
}
function compareHmac(hmacSignature, merchantSignature) {
  var bitwiseComparison;
  if (hmacSignature.length !== merchantSignature.length) {
    return false;
  }
  for (var i = 0; i < hmacSignature.length; i++) {
    bitwiseComparison |= hmacSignature.charCodeAt(i) ^ merchantSignature.charCodeAt(i);
  }
  return bitwiseComparison === 0;
}
function validateHmacSignature(request) {
  var notificationData = request.form;
  var hmacSignature = notificationData['additionalData.hmacSignature'];
  var merchantSignature = AuthenticationUtils.calculateHmacSignature(request);
  // Checking for timing attacks
  if (compareHmac(hmacSignature, merchantSignature)) {
    return true;
  }
  AdyenLogs.error_log('HMAC signatures mismatch, the notification request is not valid');
  return false;
}
module.exports = {
  check: check,
  validateHmacSignature: validateHmacSignature
};