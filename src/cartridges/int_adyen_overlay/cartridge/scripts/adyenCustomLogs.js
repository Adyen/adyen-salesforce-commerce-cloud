var Logger = require('dw/system/Logger');

function fatal_log(msg) {
  return Logger.getLogger('Adyen_Fatal', 'Adyen').fatal(msg);
}

function error_log(msg) {
  return Logger.getLogger('Adyen_Error', 'Adyen').error(msg);
}

function debug_log(msg) {
  return Logger.getLogger('Adyen_Debug', 'Adyen').debug(msg);
}

function info_log(msg) {
  return Logger.getLogger('Adyen_Info', 'Adyen').info(msg);
}

module.exports = {
  fatal_log,
  error_log,
  debug_log,
  info_log,
};
