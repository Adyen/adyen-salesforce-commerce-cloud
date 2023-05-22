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
const AuthenticationUtils = require('*/cartridge/scripts/libs/libAuthenticationUtils');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

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

function compareHmac(hmacSignature, merchantSignature){
  let bitwiseComparison;
  if (hmacSignature.length !== merchantSignature.length){
    return false;
  }
  for (let i = 0; i <= (hmacSignature.length - 1); i++) {
    bitwiseComparison |= hmacSignature.charCodeAt(i) ^ merchantSignature.charCodeAt(i);
  }
  return bitwiseComparison === 0;
};

function validateHmacSignature(request){
  const notificationData = request.form;
  const hmacSignature = notificationData['additionalData.hmacSignature'];
  const merchantSignature = AuthenticationUtils.calculateHmacSignature(request);
  // Checking for timing attacks
  if (compareHmac(hmacSignature, merchantSignature)){
    AdyenLogs.info_log(`Successfully compared the HMAC Signatures, notification is coming from Adyen`);
    return true;
  };
  return false;
};

module.exports = {
  check,
  validateHmacSignature,
};
