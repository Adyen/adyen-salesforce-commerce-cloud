"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var dwsystem = require('dw/system');
var adyenCurrentSite = dwsystem.Site.getCurrent();
function getCustomPreference(field) {
  var customPreference = null;
  if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
    customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
  }
  return customPreference;
}
function setCustomPreference(field, value) {
  var customPreference = null;
  if (adyenCurrentSite) {
    adyenCurrentSite.setCustomPreferenceValue(field, value);
    customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
  }
  return customPreference;
}
var adyenConfigsObj = {
  setCustomPreference: setCustomPreference,
  getAdyenEnvironment: function getAdyenEnvironment() {
    return getCustomPreference('Adyen_Mode').value;
  },
  setAdyenEnvironment: function setAdyenEnvironment(value) {
    return setCustomPreference('Adyen_Mode', value).value;
  },
  getAdyenMerchantAccount: function getAdyenMerchantAccount() {
    return getCustomPreference('Adyen_merchantCode');
  },
  getAdyenSFRA6Compatibility: function getAdyenSFRA6Compatibility() {
    return getCustomPreference('Adyen_SFRA6_Compatibility');
  },
  setAdyenSFRA6Compatibility: function setAdyenSFRA6Compatibility(value) {
    return setCustomPreference('Adyen_SFRA6_Compatibility', value);
  },
  getAdyenNotificationUser: function getAdyenNotificationUser() {
    return getCustomPreference('Adyen_notification_user');
  },
  getAdyenNotificationPassword: function getAdyenNotificationPassword() {
    return getCustomPreference('Adyen_notification_password');
  },
  getAdyenRecurringPaymentsEnabled: function getAdyenRecurringPaymentsEnabled() {
    return getCustomPreference('AdyenOneClickEnabled');
  },
  getCreditCardInstallments: function getCreditCardInstallments() {
    return getCustomPreference('AdyenCreditCardInstallments');
  },
  getSystemIntegratorName: function getSystemIntegratorName() {
    return getCustomPreference('Adyen_IntegratorName');
  },
  getAdyenClientKey: function getAdyenClientKey() {
    return getCustomPreference('Adyen_ClientKey');
  },
  getGoogleMerchantID: function getGoogleMerchantID() {
    return getCustomPreference('Adyen_GooglePayMerchantID');
  },
  getRatePayMerchantID: function getRatePayMerchantID() {
    return getCustomPreference('AdyenRatePayID');
  },
  getAdyenStoreId: function getAdyenStoreId() {
    return getCustomPreference('Adyen_StoreId');
  },
  getAdyenApiKey: function getAdyenApiKey() {
    return getCustomPreference('Adyen_API_Key');
  },
  getAdyenFrontendRegion: function getAdyenFrontendRegion() {
    return getCustomPreference('Adyen_Frontend_Region').value;
  },
  getAdyenBasketFieldsEnabled: function getAdyenBasketFieldsEnabled() {
    return getCustomPreference('AdyenBasketFieldsEnabled');
  },
  getAdyenCardholderNameEnabled: function getAdyenCardholderNameEnabled() {
    return getCustomPreference('AdyenCardHolderName_enabled');
  },
  getAdyenLevel23DataEnabled: function getAdyenLevel23DataEnabled() {
    return getCustomPreference('AdyenLevel23DataEnabled');
  },
  getAdyenLevel23CommodityCode: function getAdyenLevel23CommodityCode() {
    return getCustomPreference('AdyenLevel23_CommodityCode');
  },
  getAdyenSalePaymentMethods: function getAdyenSalePaymentMethods() {
    return getCustomPreference('AdyenSalePaymentMethods') ? getCustomPreference('AdyenSalePaymentMethods').toString().split(',') : [];
  },
  getAdyenGivingEnabled: function getAdyenGivingEnabled() {
    return getCustomPreference('AdyenGiving_enabled');
  },
  getAdyenGivingDonationAmounts: function getAdyenGivingDonationAmounts() {
    return getCustomPreference('AdyenGiving_donationAmounts');
  },
  getAdyenGivingCharityAccount: function getAdyenGivingCharityAccount() {
    return getCustomPreference('AdyenGiving_charityAccount');
  },
  getAdyenGivingCharityName: function getAdyenGivingCharityName() {
    return getCustomPreference('AdyenGiving_charityName');
  },
  getAdyenGivingCharityDescription: function getAdyenGivingCharityDescription() {
    return getCustomPreference('AdyenGiving_charityDescription');
  },
  getAdyenGivingCharityWebsite: function getAdyenGivingCharityWebsite() {
    return getCustomPreference('AdyenGiving_charityUrl');
  },
  getAdyenGivingBackgroundUrl: function getAdyenGivingBackgroundUrl() {
    var _getCustomPreference;
    return (_getCustomPreference = getCustomPreference('AdyenGiving_backgroundUrl')) === null || _getCustomPreference === void 0 ? void 0 : _getCustomPreference.getAbsURL();
  },
  getAdyenGivingLogoUrl: function getAdyenGivingLogoUrl() {
    var _getCustomPreference2;
    return (_getCustomPreference2 = getCustomPreference('AdyenGiving_logoUrl')) === null || _getCustomPreference2 === void 0 ? void 0 : _getCustomPreference2.getAbsURL();
  },
  getAdyenExpressPaymentMethods: function getAdyenExpressPaymentMethods() {
    var paymentMethods = [];
    var _iterator = _createForOfIteratorHelper(getCustomPreference('AdyenExpressPaymentMethods')),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var expressPaymentMethod = _step.value;
        paymentMethods.push(expressPaymentMethod.displayValue);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return paymentMethods;
  },
  getAdyenPaypalExpressEnabled: function getAdyenPaypalExpressEnabled() {
    return this.getAdyenExpressPaymentMethods().indexOf('paypal') !== -1;
  }
};
module.exports = adyenConfigsObj;