"use strict";

var Logger = require('dw/system/Logger');
function fatal_log(msg, error) {
  var logMsg = [msg, error === null || error === void 0 ? void 0 : error.toString(), error === null || error === void 0 ? void 0 : error.stack].join('\n').trim();
  Logger.getLogger('Adyen_fatal', 'Adyen').fatal(logMsg);
}
function error_log(msg, error) {
  var logMsg = [msg, error === null || error === void 0 ? void 0 : error.toString(), error === null || error === void 0 ? void 0 : error.stack].join('\n').trim();
  Logger.getLogger('Adyen_error', 'Adyen').error(logMsg);
}
function debug_log(msg) {
  Logger.getLogger('Adyen_debug', 'Adyen').debug(msg);
}
function info_log(msg) {
  Logger.getLogger('Adyen_info', 'Adyen').info(msg);
}
module.exports = {
  fatal_log: fatal_log,
  error_log: error_log,
  debug_log: debug_log,
  info_log: info_log
};