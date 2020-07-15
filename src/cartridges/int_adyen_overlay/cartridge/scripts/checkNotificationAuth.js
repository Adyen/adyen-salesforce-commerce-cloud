/**
 *	Script used to authentication notification calls from Adyen
 *
 *   @input CurrentRequest : dw.system.Request
 *   @output Authenticated : Boolean
 *
 */
const Site = require('dw/system/Site');
const AuthenticationUtils = require('*/cartridge/scripts/libs/libAuthenticationUtils');

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

module.exports = {
  check: check,
};
