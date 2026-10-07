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
 * Copyright (c) 2025 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
const Locale = require('dw/util/Locale');
// script includes
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');

const localeHelper = {
  /**
   * Checks whether a locale ID can be resolved to a locale with a country.
   * Orders placed on a URL without a locale segment carry 'default', which
   * cannot be resolved and breaks consumers such as SFRA's email helpers.
   * @param {string} localeId - the locale ID to check, e.g. 'en_US'
   * @returns {boolean} true when the locale ID is usable
   */
  isUsableLocaleId(localeId) {
    if (!localeId || localeId === constants.LOCALE.DEFAULT_ID) {
      return false;
    }
    const locale = Locale.getLocale(localeId);
    return !!(locale && locale.country);
  },

  /**
   * @returns {string} the configured fallback locale ID, or the built-in one
   */
  getFallbackLocaleId() {
    const configuredLocaleId = AdyenConfigs.getAdyenDefaultLocale();
    return this.isUsableLocaleId(configuredLocaleId)
      ? configuredLocaleId
      : constants.LOCALE.FALLBACK_ID;
  },

  /**
   * @param {string} localeId - the locale ID of the order or basket
   * @returns {string} the given locale ID when usable, the fallback otherwise
   */
  resolveLocaleId(localeId) {
    return this.isUsableLocaleId(localeId)
      ? localeId
      : this.getFallbackLocaleId();
  },

  /**
   * @param {string} localeId - the locale ID of the order or basket
   * @returns {string} a resolved locale ID in the Adyen API format, e.g. 'en-US'
   */
  getShopperLocale(localeId) {
    return this.resolveLocaleId(localeId).replace('_', '-');
  },

  /**
   * Deriving the country from the last two characters of a locale ID turns
   * 'default' into 'lt', which components such as Apple Pay reject.
   * @param {string} localeId - the locale ID of the request
   * @returns {string} the uppercase ISO 3166-1 alpha-2 country, e.g. 'US'
   */
  getCountryCode(localeId) {
    const locale = Locale.getLocale(this.resolveLocaleId(localeId));
    return locale && locale.country
      ? locale.country
      : Locale.getLocale(constants.LOCALE.FALLBACK_ID).country;
  },
};

module.exports = localeHelper;
