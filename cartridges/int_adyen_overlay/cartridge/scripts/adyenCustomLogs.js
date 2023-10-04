"use strict";

var Logger = require('dw/system/Logger');
function fatal_log(msg) {
  return Logger.getLogger('Adyen_fatal', 'Adyen').fatal(msg);
}
function error_log(msg) {
  return Logger.getLogger('Adyen_error', 'Adyen').error(msg);
}
function debug_log(msg) {
  return Logger.getLogger('Adyen_debug', 'Adyen').debug(msg);
}
function info_log(msg) {
  return Logger.getLogger('Adyen_info', 'Adyen').info(msg);
}
module.exports = {
  fatal_log: fatal_log,
  error_log: error_log,
  debug_log: debug_log,
  info_log: info_log
};