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
const Site = require('dw/system/Site');
const AuthenticationUtils = require('*/cartridge/adyen/webhooks/libs/libAuthenticationUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function check(request) {
  const baUser = Site.getCurrent().getCustomPreferenceValue(
    'Adyen_notification_user',
  );
  const baPassword = Site.getCurrent().getCustomPreferenceValue(
    'Adyen_notification_password',
  );
  const baHeader = request.httpHeaders.authorization;
  if (!(baUser && baPassword && baHeader)) {
    return false;
  }

  return AuthenticationUtils.checkGivenCredentials(
    baHeader,
    baUser,
    baPassword,
  );
}

function compareHmac(hmacSignature, merchantSignature) {
  let bitwiseComparison;
  if (hmacSignature.length !== merchantSignature.length) {
    return false;
  }
  for (let i = 0; i < hmacSignature.length; i++) {
    bitwiseComparison |=
      hmacSignature.charCodeAt(i) ^ merchantSignature.charCodeAt(i);
  }
  return bitwiseComparison === 0;
}

function validateHmacSignature(request) {
  const notificationData = request.form;
  const hmacSignature = notificationData['additionalData.hmacSignature'];
  const merchantSignature = AuthenticationUtils.calculateHmacSignature(request);
  // Checking for timing attacks
  if (compareHmac(hmacSignature, merchantSignature)) {
    return true;
  }
  AdyenLogs.error_log(
    'HMAC signatures mismatch, the notification request is not valid',
  );
  return false;
}

module.exports = {
  check,
  validateHmacSignature,
};
