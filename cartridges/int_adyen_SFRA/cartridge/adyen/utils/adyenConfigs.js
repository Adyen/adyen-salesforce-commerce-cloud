"use strict";

var Site = require('dw/system/Site');
var adyenCurrentSite = Site.getCurrent();
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
  getAdyenHmacKey: function getAdyenHmacKey() {
    return getCustomPreference('Adyen_Hmac_Key');
  },
  getAdyenRecurringPaymentsEnabled: function getAdyenRecurringPaymentsEnabled() {
    return getCustomPreference('AdyenOneClickEnabled');
  },
  getKlarnaInlineWidgetEnabled: function getKlarnaInlineWidgetEnabled() {
    return getCustomPreference('Adyen_klarnaWidget');
  },
  getAdyenInstallmentsEnabled: function getAdyenInstallmentsEnabled() {
    return getCustomPreference('AdyenInstallments_enabled');
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
  getLivePrefix: function getLivePrefix() {
    return getCustomPreference('Adyen_LivePrefix');
  },
  getGoogleMerchantID: function getGoogleMerchantID() {
    return getCustomPreference('Adyen_GooglePayMerchantID');
  },
  getRatePayMerchantID: function getRatePayMerchantID() {
    return getCustomPreference('AdyenRatePayID');
  },
  getApplePayDomainAssociation: function getApplePayDomainAssociation() {
    return getCustomPreference('Adyen_ApplePay_DomainAssociation');
  },
  getAdyenStoreId: function getAdyenStoreId() {
    return getCustomPreference('Adyen_StoreId');
  },
  getAdyenActiveStoreId: function getAdyenActiveStoreId() {
    return getCustomPreference('Adyen_SelectedStoreID');
  },
  getAdyenApiKey: function getAdyenApiKey() {
    return getCustomPreference('Adyen_API_Key');
  },
  getAdyenFrontendRegion: function getAdyenFrontendRegion() {
    return getCustomPreference('Adyen_Frontend_Region').value;
  },
  getAdyenPosRegion: function getAdyenPosRegion() {
    return getCustomPreference('Adyen_Pos_Region').value;
  },
  getAdyenTokenisationEnabled: function getAdyenTokenisationEnabled() {
    return getCustomPreference('AdyenTokenisationEnabled');
  },
  getAdyenBasketFieldsEnabled: function getAdyenBasketFieldsEnabled() {
    return getCustomPreference('AdyenBasketFieldsEnabled');
  },
  getAdyenLevel23DataEnabled: function getAdyenLevel23DataEnabled() {
    return getCustomPreference('AdyenLevel23DataEnabled');
  },
  getAdyenLevel23CommodityCode: function getAdyenLevel23CommodityCode() {
    return getCustomPreference('AdyenLevel23_CommodityCode');
  },
  getAdyenSalePaymentMethods: function getAdyenSalePaymentMethods() {
    var adyenSalePaymentMethods = getCustomPreference('AdyenSalePaymentMethods');
    return adyenSalePaymentMethods ? adyenSalePaymentMethods.replace(/\s/g, '').toString().split(',') : [];
  },
  getAdyenGivingEnabled: function getAdyenGivingEnabled() {
    return getCustomPreference('AdyenGiving_enabled');
  },
  areExpressPaymentsEnabled: function areExpressPaymentsEnabled() {
    return this.isApplePayExpressEnabled() || this.isAmazonPayExpressEnabled() || this.isPayPalExpressEnabled() || this.isGooglePayExpressEnabled();
  },
  arePdpExpressPaymentsEnabled: function arePdpExpressPaymentsEnabled() {
    return this.isApplePayExpressOnPdpEnabled();
  },
  isApplePayExpressEnabled: function isApplePayExpressEnabled() {
    return getCustomPreference('ApplePayExpress_Enabled');
  },
  isApplePayExpressOnPdpEnabled: function isApplePayExpressOnPdpEnabled() {
    return getCustomPreference('ApplePayExpress_Pdp_Enabled');
  },
  isGooglePayExpressEnabled: function isGooglePayExpressEnabled() {
    return getCustomPreference('GooglePayExpress_Enabled');
  },
  isGooglePayExpressOnPdpEnabled: function isGooglePayExpressOnPdpEnabled() {
    return getCustomPreference('GooglePayExpress_Pdp_Enabled');
  },
  isAmazonPayExpressEnabled: function isAmazonPayExpressEnabled() {
    return getCustomPreference('AmazonPayExpress_Enabled');
  },
  isPayPalExpressEnabled: function isPayPalExpressEnabled() {
    return getCustomPreference('PayPalExpress_Enabled');
  },
  isPayPalExpressReviewPageEnabled: function isPayPalExpressReviewPageEnabled() {
    return getCustomPreference('PayPalExpress_ReviewPage_Enabled');
  },
  getExpressPaymentsOrder: function getExpressPaymentsOrder() {
    return getCustomPreference('ExpressPayments_order');
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