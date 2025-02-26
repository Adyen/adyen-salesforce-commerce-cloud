const Site = require('dw/system/Site');

const adyenCurrentSite = Site.getCurrent();

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

  getAdyenInstallmentsEnabled() {
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

  getLivePrefix() {
    return getCustomPreference('Adyen_LivePrefix');
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

  getAdyenActiveStoreId() {
    return getCustomPreference('Adyen_SelectedStoreID');
  },

  getAdyenApiKey() {
    return getCustomPreference('Adyen_API_Key');
  },

  getAdyenFrontendRegion() {
    return getCustomPreference('Adyen_Frontend_Region').value;
  },

  getAdyenPosRegion() {
    return getCustomPreference('Adyen_Pos_Region').value;
  },

  getAdyenTokenisationEnabled() {
    return getCustomPreference('AdyenTokenisationEnabled');
  },

  getAdyenBasketFieldsEnabled() {
    return getCustomPreference('AdyenBasketFieldsEnabled');
  },

  getAdyenLevel23DataEnabled() {
    return getCustomPreference('AdyenLevel23DataEnabled');
  },

  getAdyenLevel23CommodityCode() {
    return getCustomPreference('AdyenLevel23_CommodityCode');
  },

  getAdyenSalePaymentMethods() {
    const adyenSalePaymentMethods = getCustomPreference(
      'AdyenSalePaymentMethods',
    );
    return adyenSalePaymentMethods
      ? adyenSalePaymentMethods.replace(/\s/g, '').toString().split(',')
      : [];
  },

  getAdyenGivingEnabled() {
    return getCustomPreference('AdyenGiving_enabled');
  },

  areExpressPaymentsEnabled() {
    return (
      this.isApplePayExpressEnabled() ||
      this.isAmazonPayExpressEnabled() ||
      this.isPayPalExpressEnabled() ||
      this.isGooglePayExpressEnabled()
    );
  },

  arePdpExpressPaymentsEnabled() {
    return this.isApplePayExpressOnPdpEnabled();
  },

  isApplePayExpressEnabled() {
    return getCustomPreference('ApplePayExpress_Enabled');
  },

  isApplePayExpressOnPdpEnabled() {
    return getCustomPreference('ApplePayExpress_Pdp_Enabled');
  },

  isGooglePayExpressEnabled() {
    return getCustomPreference('GooglePayExpress_Enabled');
  },

  isGooglePayExpressOnPdpEnabled() {
    return getCustomPreference('GooglePayExpress_Pdp_Enabled');
  },

  isAmazonPayExpressEnabled() {
    return getCustomPreference('AmazonPayExpress_Enabled');
  },

  isPayPalExpressEnabled() {
    return getCustomPreference('PayPalExpress_Enabled');
  },

  isPayPalExpressReviewPageEnabled() {
    return getCustomPreference('PayPalExpress_ReviewPage_Enabled');
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
