const dwsystem = require('dw/system');
const adyenCurrentSite = dwsystem.Site.getCurrent();

function getCustomPreference(field) {
  let customPreference = null;
  if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
    customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
  }
  return customPreference;
}

function setCustomPreference(field, value) {
  let customPreference = null;
  if (adyenCurrentSite) {
    adyenCurrentSite.setCustomPreferenceValue(field, value);
    customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
  }
  return customPreference;
}

const adyenConfigsObj = {
  setCustomPreference,

  getAdyenEnvironment() {
    return getCustomPreference('Adyen_Mode').value;
  },

  setAdyenEnvironment(value) {
    return setCustomPreference('Adyen_Mode', value).value;
  },

  getAdyenMerchantAccount() {
    return getCustomPreference('Adyen_merchantCode');
  },

  getAdyenSFRA6Compatibility() {
    return getCustomPreference('Adyen_SFRA6_Compatibility');
  },

  setAdyenSFRA6Compatibility(value) {
    return setCustomPreference('Adyen_SFRA6_Compatibility', value);
  },

  getAdyenNotificationUser() {
    return getCustomPreference('Adyen_notification_user');
  },

  getAdyenNotificationPassword() {
    return getCustomPreference('Adyen_notification_password');
  },

  getAdyenHmacKey() {
    return getCustomPreference('Adyen_Hmac_Key');
  },

  getAdyenRecurringPaymentsEnabled() {
    return getCustomPreference('AdyenOneClickEnabled');
  },

  getKlarnaInlineWidgetEnabled() {
    return getCustomPreference('Adyen_klarnaWidget');
  },

  getAdyenInstallmentsEnabled(){
    return getCustomPreference('AdyenInstallments_enabled');
  },

  getCreditCardInstallments() {
    return getCustomPreference('AdyenCreditCardInstallments');
  },

  getSystemIntegratorName() {
    return getCustomPreference('Adyen_IntegratorName');
  },

  getAdyenClientKey() {
    return getCustomPreference('Adyen_ClientKey');
  },

  getGoogleMerchantID() {
    return getCustomPreference('Adyen_GooglePayMerchantID');
  },

  getRatePayMerchantID() {
    return getCustomPreference('AdyenRatePayID');
  },

  getApplePayDomainAssociation() {
    return getCustomPreference('Adyen_ApplePay_DomainAssociation');
  },

  getAdyenStoreId() {
    return getCustomPreference('Adyen_StoreId');
  },

  getAdyenApiKey() {
    return getCustomPreference('Adyen_API_Key');
  },

  getAdyenFrontendRegion() {
    return getCustomPreference('Adyen_Frontend_Region').value;
  },

  getAdyenTokenisationEnabled: function () {
    return getCustomPreference('AdyenTokenisationEnabled');
  },

  getAdyenBasketFieldsEnabled() {
    return getCustomPreference('AdyenBasketFieldsEnabled');
  },

  getAdyenCardholderNameEnabled: function () {
    return getCustomPreference('AdyenCardHolderName_enabled');
  },

  getAdyenLevel23DataEnabled: function () {
    return getCustomPreference('AdyenLevel23DataEnabled');
  },

  getAdyenLevel23CommodityCode: function () {
    return getCustomPreference('AdyenLevel23_CommodityCode');
  },

  getAdyenSalePaymentMethods: function () {
    return getCustomPreference('AdyenSalePaymentMethods')
      ? getCustomPreference('AdyenSalePaymentMethods').replace(/\s/g, '').toString().split(',')
      : [];
  },

  getAdyenGivingEnabled() {
    return getCustomPreference('AdyenGiving_enabled');
  },

  areExpressPaymentsEnabled() {
    return getCustomPreference('ExpressPayments_enabled');
  },

  isApplePayExpressEnabled() {
    return getCustomPreference('ApplePayExpress_Enabled');
  },

  isAmazonPayExpressEnabled() {
    return getCustomPreference('AmazonPayExpress_Enabled');
  },

  getExpressPaymentsOrder() {
    return getCustomPreference('ExpressPayments_order');
  },

  getAdyenGivingDonationAmounts() {
    return getCustomPreference('AdyenGiving_donationAmounts');
  },

  getAdyenGivingCharityAccount() {
    return getCustomPreference('AdyenGiving_charityAccount');
  },

  getAdyenGivingCharityName() {
    return getCustomPreference('AdyenGiving_charityName');
  },

  getAdyenGivingCharityDescription() {
    return getCustomPreference('AdyenGiving_charityDescription');
  },

  getAdyenGivingCharityWebsite() {
    return getCustomPreference('AdyenGiving_charityUrl');
  },

  getAdyenGivingBackgroundUrl() {
    return getCustomPreference('AdyenGiving_backgroundUrl')?.getAbsURL();
  },

  getAdyenGivingLogoUrl() {
    return getCustomPreference('AdyenGiving_logoUrl')?.getAbsURL();
  },
};

module.exports = adyenConfigsObj;
