"use strict";

var app = require('app_storefront_controllers/cartridge/scripts/app');
var OrderModel = app.getModel('Order');
function submit(order) {
  return OrderModel.submit(order);
}
var EXTERNAL_PLATFORM_VERSION = 'SG';
function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}
module.exports = {
  submit: submit,
  getExternalPlatformVersion: getExternalPlatformVersion
};