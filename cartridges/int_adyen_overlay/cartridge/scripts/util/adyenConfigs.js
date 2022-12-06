"use strict";

var dwsystem = require('dw/system');
var adyenCurrentSite = dwsystem.Site.getCurrent();
function getCustomPreference(field) {
  var customPreference = null;
  if (adyenCurrentSite) {
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
  getAdyen3DS2Enabled: function getAdyen3DS2Enabled() {
    return getCustomPreference('Adyen3DS2Enabled');
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
  }
};
module.exports = adyenConfigsObj;