const Logger = require('dw/system/Logger');

function fatal_log(msg, error) {
  const logMsg = [msg, error?.toString(), error?.stack].join('\n').trim();
  Logger.getLogger('Adyen_fatal', 'Adyen').fatal(logMsg);
}

function error_log(msg, error) {
  const logMsg = [msg, error?.toString(), error?.stack].join('\n').trim();
  Logger.getLogger('Adyen_error', 'Adyen').error(logMsg);
}

function debug_log(msg) {
  Logger.getLogger('Adyen_debug', 'Adyen').debug(msg);
}

function info_log(msg) {
  Logger.getLogger('Adyen_info', 'Adyen').info(msg);
}

module.exports = {
  fatal_log,
  error_log,
  debug_log,
  info_log,
};
