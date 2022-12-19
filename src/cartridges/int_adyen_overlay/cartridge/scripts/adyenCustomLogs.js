var Logger = require('dw/system/Logger');
var fatal_log = Logger.getLogger('Adyen_Fatal', 'Adyen');
var error_log = Logger.getLogger('Adyen_Error', 'Adyen');
var info_log = Logger.getLogger('Adyen_Info', 'Adyen');
var debug_log = Logger.getLogger('Adyen_Debug', 'Adyen');

module.exports = {
  fatal_log,
  error_log,
  info_log,
  debug_log,
};
