"use strict";

/**
 *  Script used to authentication notification calls from Adyen
 *
 *   @input CurrentRequest : dw.system.Request
 *   @output Authenticated : Boolean
 *
 */
var Site = require('dw/system/Site');

var AuthenticationUtils = require('*/cartridge/scripts/libs/libAuthenticationUtils');

function check(request) {
  var baUser = Site.getCurrent().getCustomPreferenceValue('Adyen_notification_user');
  var baPassword = Site.getCurrent().getCustomPreferenceValue('Adyen_notification_password');
  var baHeader = request.httpHeaders.authorization;

  if (!(baUser && baPassword && baHeader)) {
    return false;
  }

  return AuthenticationUtils.checkGivenCredentials(baHeader, baUser, baPassword);
}

module.exports = {
  check: check
};