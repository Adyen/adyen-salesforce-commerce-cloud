"use strict";

var authorize = require('*/cartridge/scripts/hooks/payment/processor/middlewares/authorize');
var handle = require('*/cartridge/scripts/hooks/payment/processor/middlewares/handle');
var posHandle = require('*/cartridge/scripts/hooks/payment/processor/middlewares/posHandle');
var posAuthorize = require('*/cartridge/scripts/hooks/payment/processor/middlewares/posAuthorize');
var processForm = require('*/cartridge/scripts/hooks/payment/processor/middlewares/processForm');
var savePaymentInformation = require('*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation');
module.exports = {
  authorize: authorize,
  handle: handle,
  posHandle: posHandle,
  posAuthorize: posAuthorize,
  processForm: processForm,
  savePaymentInformation: savePaymentInformation
};