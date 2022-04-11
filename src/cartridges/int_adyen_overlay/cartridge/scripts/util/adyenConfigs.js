/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2022 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
const dwsystem = require('dw/system');
const adyenCurrentSite = dwsystem.Site.getCurrent();

function getCustomPreference(field) {
    let customPreference = null;
    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
        customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
    }
    return customPreference;
}

const adyenConfigsObj = {
    getAdyenEnvironment() {
        return getCustomPreference('Adyen_Mode').value;
    },

    getAdyenMerchantAccount() {
        return getCustomPreference('Adyen_merchantCode');
    },

    getAdyenSFRA6Compatibility() {
        return getCustomPreference('Adyen_SFRA6_Compatibility');
    },

    getAdyen3DS2Enabled() {
        return getCustomPreference('Adyen3DS2Enabled');
    },

    getAdyenRecurringPaymentsEnabled() {
        return getCustomPreference('AdyenOneClickEnabled');
    },

    getCreditCardInstallments() {
        return getCustomPreference('AdyenCreditCardInstallments');
    },

    getSystemIntegratorName: function () {
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

    getAdyenStoreId() {
        return getCustomPreference('Adyen_StoreId');
    },

    getAdyenApiKey() {
        return getCustomPreference('Adyen_API_Key');
    },

    getAdyenFrontendRegion() {
        return getCustomPreference('Adyen_Frontend_Region');
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
        return getCustomPreference('AdyenSalePaymentMethods') ? getCustomPreference('AdyenSalePaymentMethods').toString().split(',') : '';
    },

    getAdyenGivingEnabled() {
        return getCustomPreference('AdyenGiving_enabled');
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
