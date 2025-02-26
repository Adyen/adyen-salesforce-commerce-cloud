"use strict";

var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

// Helper function to save to metadata field
function saveMetadataField(field, data) {
  var currentSite = Site.getCurrent();
  Transaction.wrap(function () {
    currentSite.setCustomPreferenceValue(field, JSON.stringify(data));
  });
}

// Helper function to initialize a service
function initializeAdyenService(svc, reqMethod) {
  var service = AdyenHelper.getService(svc, reqMethod);
  var apiKey = AdyenConfigs.getAdyenApiKey();
  var merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  if (!service || !apiKey || !merchantAccount) {
    throw new Error('Missing request parameters, could not perform the call');
  }
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-key', apiKey);
  return service;
}
module.exports = {
  saveMetadataField: saveMetadataField,
  initializeAdyenService: initializeAdyenService
};