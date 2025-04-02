"use strict";

var server = require('server');
var Transaction = require('dw/system/Transaction');
var csrfProtection = require('dw/web/CSRFProtection');
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var bmHelper = require('*/cartridge/utils/helper');
var managementApi = require('*/cartridge/scripts/managementApi');
server.get('Start', function (_req, res, next) {
  if (!csrfProtection.validateRequest()) {
    res.redirect(URLUtils.url('CSRF-Fail'));
    return next();
  }
  res.render('adyenSettings/settings');
  return next();
});
server.post('Save', server.middleware.https, function (req, res, next) {
  try {
    var requestBody = JSON.parse(req.body);
    requestBody.settings.forEach(function (setting) {
      Transaction.wrap(function () {
        AdyenConfigs.setCustomPreference(setting.key, setting.value);
      });
    });
    res.json({
      success: true
    });
  } catch (error) {
    AdyenLogs.error_log('Error while saving settings in BM configuration:', error);
    res.json({
      success: false
    });
  }
  return next();
});
server.post('TestConnection', server.middleware.https, function (req, res, next) {
  try {
    var service = AdyenHelper.getService(constants.SERVICE.CHECKOUTPAYMENTMETHODS);
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }
    var serviceApiVersion = service.getURL().replace('[CHECKOUT_API_VERSION]', constants.CHECKOUT_API_VERSION);
    service.setURL(serviceApiVersion);
    if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE) {
      var livePrefix = AdyenConfigs.getLivePrefix();
      var serviceUrl = service.getURL().replace('[YOUR_LIVE_PREFIX]', livePrefix);
      service.setURL(serviceUrl);
    }
    var requestBody = JSON.parse(req.body);
    var xApiKey = requestBody.xApiKey,
      merchantAccount = requestBody.merchantAccount;
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xApiKey);
    var callResult = service.call(JSON.stringify({
      merchantAccount: merchantAccount
    }));
    if (!callResult.isOk()) {
      var _JSON$parse = JSON.parse(callResult.getErrorMessage()),
        message = _JSON$parse.message;
      res.json({
        success: false,
        message: message,
        error: true
      });
      return next();
    }
    res.json({
      success: true,
      error: false
    });
  } catch (error) {
    AdyenLogs.error_log('Error while testing API credentials:', error);
    res.json({
      error: true,
      message: 'an unknown error has occurred',
      success: false
    });
  }
  return next();
});
server.get('GetStores', server.middleware.https, function (req, res, next) {
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    try {
      bmHelper.saveMetadataField('Adyen_StoreId', []);
      var stores = managementApi.fetchAllStores();
      bmHelper.saveMetadataField('Adyen_StoreId', stores);
      res.json({
        success: true,
        stores: stores
      });
    } catch (error) {
      AdyenLogs.error_log('Error while fetching stores:', error);
      res.json({
        success: false
      });
    }
    return next();
  }
  return {};
});
module.exports = server.exports();