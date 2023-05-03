"use strict";

var _adyenConfigsObj;
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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
var adyenConfigsObj = (_adyenConfigsObj = {
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
  getAdyenApplePayTokenisationEnabled: function getAdyenApplePayTokenisationEnabled() {
    return getCustomPreference('AdyenApplePayTokenisationEnabled');
  },
  getAdyenSalePaymentMethods: function getAdyenSalePaymentMethods() {
    return getCustomPreference('AdyenSalePaymentMethods') ? getCustomPreference('AdyenSalePaymentMethods').toString().split(',') : '';
  },
  getAdyenBasketFieldsEnabled: function getAdyenBasketFieldsEnabled() {
    return getCustomPreference('AdyenBasketFieldsEnabled');
  }
}, _defineProperty(_adyenConfigsObj, "getAdyenApplePayTokenisationEnabled", function getAdyenApplePayTokenisationEnabled() {
  return getCustomPreference('AdyenApplePayTokenisationEnabled');
}), _defineProperty(_adyenConfigsObj, "getAdyenCardholderNameEnabled", function getAdyenCardholderNameEnabled() {
  return getCustomPreference('AdyenCardHolderName_enabled');
}), _defineProperty(_adyenConfigsObj, "getAdyenLevel23DataEnabled", function getAdyenLevel23DataEnabled() {
  return getCustomPreference('AdyenLevel23DataEnabled');
}), _defineProperty(_adyenConfigsObj, "getAdyenLevel23CommodityCode", function getAdyenLevel23CommodityCode() {
  return getCustomPreference('AdyenLevel23_CommodityCode');
}), _defineProperty(_adyenConfigsObj, "getAdyenSalePaymentMethods", function getAdyenSalePaymentMethods() {
  return getCustomPreference('AdyenSalePaymentMethods') ? getCustomPreference('AdyenSalePaymentMethods').toString().split(',') : [];
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingEnabled", function getAdyenGivingEnabled() {
  return getCustomPreference('AdyenGiving_enabled');
}), _defineProperty(_adyenConfigsObj, "areExpressPaymentsEnabled", function areExpressPaymentsEnabled() {
  return getCustomPreference('ExpressPayments_enabled');
}), _defineProperty(_adyenConfigsObj, "isApplePayExpressEnabled", function isApplePayExpressEnabled() {
  return getCustomPreference('ApplePayExpress_Enabled');
}), _defineProperty(_adyenConfigsObj, "isAmazonPayExpressEnabled", function isAmazonPayExpressEnabled() {
  return getCustomPreference('AmazonPayExpress_Enabled');
}), _defineProperty(_adyenConfigsObj, "getExpressPaymentsOrder", function getExpressPaymentsOrder() {
  return getCustomPreference('ExpressPayments_order');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingDonationAmounts", function getAdyenGivingDonationAmounts() {
  return getCustomPreference('AdyenGiving_donationAmounts');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingCharityAccount", function getAdyenGivingCharityAccount() {
  return getCustomPreference('AdyenGiving_charityAccount');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingCharityName", function getAdyenGivingCharityName() {
  return getCustomPreference('AdyenGiving_charityName');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingCharityDescription", function getAdyenGivingCharityDescription() {
  return getCustomPreference('AdyenGiving_charityDescription');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingCharityWebsite", function getAdyenGivingCharityWebsite() {
  return getCustomPreference('AdyenGiving_charityUrl');
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingBackgroundUrl", function getAdyenGivingBackgroundUrl() {
  var _getCustomPreference;
  return (_getCustomPreference = getCustomPreference('AdyenGiving_backgroundUrl')) === null || _getCustomPreference === void 0 ? void 0 : _getCustomPreference.getAbsURL();
}), _defineProperty(_adyenConfigsObj, "getAdyenGivingLogoUrl", function getAdyenGivingLogoUrl() {
  var _getCustomPreference2;
  return (_getCustomPreference2 = getCustomPreference('AdyenGiving_logoUrl')) === null || _getCustomPreference2 === void 0 ? void 0 : _getCustomPreference2.getAbsURL();
}), _adyenConfigsObj);
module.exports = adyenConfigsObj;