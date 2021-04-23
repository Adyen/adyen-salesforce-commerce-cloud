"use strict";

/**
 *
 */
var dwsvc = require('dw/svc');

var dwsystem = require('dw/system');

var dwutil = require('dw/util');

var URLUtils = require('dw/web/URLUtils');

var Bytes = require('dw/util/Bytes');

var MessageDigest = require('dw/crypto/MessageDigest');

var Encoding = require('dw/crypto/Encoding');

var adyenCurrentSite = dwsystem.Site.getCurrent();
/* eslint no-var: off */

var adyenHelperObj = {
  // service constants
  SERVICE: {
    PAYMENT: 'AdyenPayment',
    PAYMENTDETAILS: 'AdyenPaymentDetails',
    RECURRING: 'AdyenRecurring',
    RECURRING_DISABLE: 'AdyenRecurringDisable',
    POSPAYMENT: 'AdyenPosPayment',
    ORIGINKEYS: 'AdyenOriginKeys',
    CHECKOUTPAYMENTMETHODS: 'AdyenCheckoutPaymentMethods',
    CONNECTEDTERMINALS: 'AdyenConnectedTerminals',
    ADYENGIVING: 'AdyenGiving'
  },
  MODE: {
    TEST: 'TEST',
    LIVE: 'LIVE'
  },
  ADYEN_LIVE_URL: 'https://live.adyen.com/',
  ADYEN_TEST_URL: 'https://test.adyen.com/',
  LOADING_CONTEXT_TEST: 'https://checkoutshopper-test.adyen.com/checkoutshopper/',
  LOADING_CONTEXT_LIVE: 'https://checkoutshopper-live.adyen.com/checkoutshopper/',
  CHECKOUT_COMPONENT_VERSION: '3.18.2',
  VERSION: '21.1.0',
  getService: function getService(service) {
    // Create the service config (used for all services)
    var adyenService = null;

    try {
      adyenService = dwsvc.LocalServiceRegistry.createService(service, {
        createRequest: function createRequest(svc, args) {
          svc.setRequestMethod('POST');

          if (args) {
            return args;
          }

          return null;
        },
        parseResponse: function parseResponse(svc, client) {
          return client;
        },
        filterLogMessage: function filterLogMessage(msg) {
          return msg;
        }
      });
      dwsystem.Logger.getLogger('Adyen', 'adyen').debug('Successfully retrive service with name {0}', service);
    } catch (e) {
      dwsystem.Logger.getLogger('Adyen', 'adyen').error("Can't get service instance with name {0}", service); // e.message
    }

    return adyenService;
  },
  getCustomPreference: function getCustomPreference(field) {
    var customPreference = null;

    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
      customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
    }

    return customPreference;
  },
  getAdyenEnvironment: function getAdyenEnvironment() {
    return adyenHelperObj.getCustomPreference('Adyen_Mode').value;
  },
  getAdyenMerchantAccount: function getAdyenMerchantAccount() {
    return adyenHelperObj.getCustomPreference('Adyen_merchantCode');
  },
  getAdyenUrl: function getAdyenUrl() {
    var returnValue = '';

    switch (adyenHelperObj.getAdyenEnvironment()) {
      case adyenHelperObj.MODE.TEST:
        returnValue = adyenHelperObj.ADYEN_TEST_URL;
        break;

      case adyenHelperObj.MODE.LIVE:
        returnValue = adyenHelperObj.ADYEN_LIVE_URL;
        break;
    }

    return returnValue;
  },
  getAdyenSecuredFieldsEnabled: function getAdyenSecuredFieldsEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenSecuredFieldsEnabled');
  },
  getAdyen3DS2Enabled: function getAdyen3DS2Enabled() {
    return adyenHelperObj.getCustomPreference('Adyen3DS2Enabled');
  },
  getAdyenRecurringPaymentsEnabled: function getAdyenRecurringPaymentsEnabled() {
    var returnValue = false;

    if (!empty(adyenCurrentSite) && (adyenCurrentSite.getCustomPreferenceValue('AdyenRecurringEnabled') || adyenCurrentSite.getCustomPreferenceValue('AdyenOneClickEnabled'))) {
      returnValue = true;
    }

    return returnValue;
  },
  getAdyenGivingConfig: function getAdyenGivingConfig(order) {
    var paymentMethod = order.custom.Adyen_paymentMethod;
    var adyenGivingAvailable = false;

    if (adyenHelperObj.getAdyenGivingEnabled() && adyenHelperObj.isAdyenGivingAvailable(paymentMethod)) {
      adyenGivingAvailable = true;
      var configuredAmounts = adyenHelperObj.getDonationAmounts();
      var charityName = adyenHelperObj.getAdyenGivingCharityName();
      var charityWebsite = adyenHelperObj.getAdyenGivingCharityWebsite();
      var charityDescription = adyenHelperObj.getAdyenGivingCharityDescription();
      var adyenGivingBackgroundUrl = adyenHelperObj.getAdyenGivingBackgroundUrl();
      var adyenGivingLogoUrl = adyenHelperObj.getAdyenGivingLogoUrl();
      var donationAmounts = {
        currency: session.currency.currencyCode,
        values: configuredAmounts
      };
    }

    return {
      adyenGivingAvailable: adyenGivingAvailable,
      configuredAmounts: configuredAmounts,
      charityName: charityName,
      charityWebsite: charityWebsite,
      charityDescription: charityDescription,
      adyenGivingBackgroundUrl: adyenGivingBackgroundUrl,
      adyenGivingLogoUrl: adyenGivingLogoUrl,
      donationAmounts: JSON.stringify(donationAmounts),
      pspReference: order.custom.Adyen_pspReference
    };
  },
  getAdyenRecurringEnabled: function getAdyenRecurringEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenRecurringEnabled');
  },
  getAdyenOneClickEnabled: function getAdyenOneClickEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenOneClickEnabled');
  },
  getCreditCardInstallments: function getCreditCardInstallments() {
    return adyenHelperObj.getCustomPreference('AdyenCreditCardInstallments');
  },
  getSystemIntegratorName: function getSystemIntegratorName() {
    return adyenHelperObj.getCustomPreference('Adyen_IntegratorName');
  },
  getPaypalMerchantID: function getPaypalMerchantID() {
    return adyenHelperObj.getCustomPreference('Adyen_PaypalMerchantID');
  },
  getGoogleMerchantID: function getGoogleMerchantID() {
    return adyenHelperObj.getCustomPreference('Adyen_GooglePayMerchantID');
  },
  getAdyenStoreId: function getAdyenStoreId() {
    return adyenHelperObj.getCustomPreference('Adyen_StoreId');
  },
  getAdyenApiKey: function getAdyenApiKey() {
    return adyenHelperObj.getCustomPreference('Adyen_API_Key');
  },
  getCheckoutUrl: function getCheckoutUrl() {
    var checkoutUrl = this.getLoadingContext();
    return "".concat(checkoutUrl, "sdk/").concat(adyenHelperObj.CHECKOUT_COMPONENT_VERSION, "/adyen.js");
  },
  getCheckoutCSS: function getCheckoutCSS() {
    var checkoutCSS = this.getLoadingContext();
    return "".concat(checkoutCSS, "sdk/").concat(adyenHelperObj.CHECKOUT_COMPONENT_VERSION, "/adyen.css");
  },
  getLoadingContext: function getLoadingContext() {
    var returnValue = '';

    switch (adyenHelperObj.getAdyenEnvironment()) {
      case adyenHelperObj.MODE.TEST:
        returnValue = adyenHelperObj.LOADING_CONTEXT_TEST;
        break;

      case adyenHelperObj.MODE.LIVE:
        returnValue = adyenHelperObj.LOADING_CONTEXT_LIVE;
        break;
    }

    return returnValue;
  },
  getAdyenHash: function getAdyenHash(value, salt) {
    var data = value + salt;
    var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    var signature = Encoding.toHex(digestSHA512.digestBytes(new Bytes(data, 'UTF-8')));
    return signature;
  },
  getAdyenBasketFieldsEnabled: function getAdyenBasketFieldsEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenBasketFieldsEnabled');
  },
  getAdyenCardholderNameEnabled: function getAdyenCardholderNameEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenCardHolderName_enabled');
  },
  getAdyenPayPalIntent: function getAdyenPayPalIntent() {
    return adyenHelperObj.getCustomPreference('AdyenPayPalIntent');
  },
  getAdyenLevel23DataEnabled: function getAdyenLevel23DataEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenLevel23DataEnabled');
  },
  getAdyenLevel23CommodityCode: function getAdyenLevel23CommodityCode() {
    return adyenHelperObj.getCustomPreference('AdyenLevel23_CommodityCode');
  },
  getAdyenGivingEnabled: function getAdyenGivingEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_enabled');
  },
  getAdyenGivingCharityAccount: function getAdyenGivingCharityAccount() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityAccount');
  },
  getAdyenGivingCharityName: function getAdyenGivingCharityName() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityName');
  },
  getAdyenGivingCharityDescription: function getAdyenGivingCharityDescription() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityDescription');
  },
  getAdyenGivingCharityWebsite: function getAdyenGivingCharityWebsite() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityUrl');
  },
  getDonationAmounts: function getDonationAmounts() {
    var returnValue = [];

    if (!empty(adyenCurrentSite) && !empty(adyenCurrentSite.getCustomPreferenceValue('AdyenGiving_donationAmounts'))) {
      var configuredValue = adyenCurrentSite.getCustomPreferenceValue('AdyenGiving_donationAmounts');
      var configuredAmountArray = configuredValue.split(',');
      var amountArray = [];

      for (var i = 0; i < configuredAmountArray.length; i++) {
        var amount = parseInt(configuredAmountArray[i]);

        if (!isNaN(amount)) {
          amountArray.push(amount);
        }
      }

      returnValue = amountArray;
    }

    return returnValue;
  },
  getAdyenGivingBackgroundUrl: function getAdyenGivingBackgroundUrl() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_backgroundUrl').getAbsURL();
  },
  getAdyenGivingLogoUrl: function getAdyenGivingLogoUrl() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_logoUrl').getAbsURL();
  },
  isAdyenGivingAvailable: function isAdyenGivingAvailable(paymentMethod) {
    var availablePaymentMethods = ['visa', 'mc', 'amex', 'cup', 'jcb', 'diners', 'discover', 'cartebancaire', 'bcmc', 'ideal', 'giropay', 'directEbanking', 'vipps', 'sepadirectdebit', 'directdebit_GB'];
    return availablePaymentMethods.indexOf(paymentMethod) !== -1;
  },
  getRatePayID: function getRatePayID() {
    var returnValue = {};

    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID')) {
      returnValue.ratePayId = adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID');
    }

    if (!session.privacy.ratePayFingerprint || session.privacy.ratePayFingerprint === null) {
      var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_256);
      returnValue.sessionID = Encoding.toHex(digestSHA512.digestBytes(new Bytes(session.sessionID, 'UTF-8')));
      session.privacy.ratePayFingerprint = returnValue.sessionID;
    }

    return returnValue;
  },
  isOpenInvoiceMethod: function isOpenInvoiceMethod(paymentMethod) {
    if (paymentMethod.indexOf('afterpay') > -1 || paymentMethod.indexOf('klarna') > -1 || paymentMethod.indexOf('ratepay') > -1 || paymentMethod.indexOf('facilypay') > -1 || paymentMethod === 'zip' || paymentMethod === 'affirm' || paymentMethod === 'clearpay') {
      return true;
    }

    return false;
  },
  isMolpayMethod: function isMolpayMethod(paymentMethod) {
    if (paymentMethod.indexOf('molpay') > -1) {
      return true;
    }

    return false;
  },
  // Get saved card token of customer saved card based on matched cardUUID
  getCardToken: function getCardToken(cardUUID, customer) {
    var token = '';

    if (customer && customer.authenticated && cardUUID) {
      var wallet = customer.getProfile().getWallet();
      var paymentInstruments = wallet.getPaymentInstruments();
      var creditCardInstrument;
      var instrumentsIter = paymentInstruments.iterator();

      while (instrumentsIter.hasNext()) {
        creditCardInstrument = instrumentsIter.next(); // find token ID exists for matching payment card

        if (creditCardInstrument.UUID.equals(cardUUID) && creditCardInstrument.getCreditCardToken()) {
          token = creditCardInstrument.getCreditCardToken();
          break;
        }
      }
    }

    return token;
  },
  createShopperObject: function createShopperObject(args) {
    var gender = 'UNKNOWN';

    if (args.paymentRequest.shopperName && args.paymentRequest.shopperName.gender) {
      gender = args.paymentRequest.shopperName.gender;
    }

    if (args.order.getDefaultShipment().getShippingAddress().getPhone()) {
      args.paymentRequest.telephoneNumber = args.order.getDefaultShipment().getShippingAddress().getPhone();
    }

    var customer = args.order.getCustomer();
    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;

    if (args.order.customerEmail) {
      args.paymentRequest.shopperEmail = args.order.customerEmail;
    }

    if (!args.order.customerEmail && profile && profile.getEmail()) {
      args.paymentRequest.shopperEmail = profile.getEmail();
    }

    var shopperDetails = {
      firstName: args.order.getBillingAddress().firstName,
      gender: gender,
      infix: '',
      lastName: args.order.getBillingAddress().lastName
    };
    args.paymentRequest.shopperName = shopperDetails;

    if (profile && profile.getCustomerNo()) {
      args.paymentRequest.shopperReference = profile.getCustomerNo();
    } else if (args.order.getCustomerNo()) {
      args.paymentRequest.shopperReference = args.order.getCustomerNo();
    }

    var shopperIP = request.getHttpRemoteAddress() ? request.getHttpRemoteAddress() : null;

    if (shopperIP) {
      args.paymentRequest.shopperIP = shopperIP;
    }

    if (request.getLocale()) {
      args.paymentRequest.shopperLocale = request.getLocale();
    }

    return args.paymentRequest;
  },
  createAddressObjects: function createAddressObjects(order, paymentMethod, paymentRequest) {
    var shippingAddress = order.defaultShipment.shippingAddress;
    paymentRequest.countryCode = shippingAddress.countryCode.value.toUpperCase();
    var shippingStreet = '';
    var shippingHouseNumberOrName = '';

    if (shippingAddress.address1) {
      shippingStreet = shippingAddress.address1;

      if (shippingAddress.address2) {
        shippingHouseNumberOrName = shippingAddress.address2;

        if (paymentMethod.indexOf('afterpaytouch') > -1) {
          shippingHouseNumberOrName = '';
          shippingStreet += " ".concat(shippingAddress.address2);
        }
      }
    } else {
      shippingStreet = 'N/A';
    }

    paymentRequest.deliveryAddress = {
      city: shippingAddress.city ? shippingAddress.city : 'N/A',
      country: shippingAddress.countryCode ? shippingAddress.countryCode.value.toUpperCase() : 'ZZ',
      houseNumberOrName: shippingHouseNumberOrName,
      postalCode: shippingAddress.postalCode ? shippingAddress.postalCode : '',
      stateOrProvince: shippingAddress.stateCode ? shippingAddress.stateCode : 'N/A',
      street: shippingStreet
    };
    var billingAddress = order.getBillingAddress();
    var billingStreet = '';
    var billingHouseNumberOrName = '';

    if (billingAddress.address1) {
      billingStreet = billingAddress.address1;

      if (billingAddress.address2) {
        billingHouseNumberOrName = billingAddress.address2;

        if (paymentMethod.indexOf('afterpaytouch') > -1) {
          billingHouseNumberOrName = '';
          billingStreet += " ".concat(billingAddress.address2);
        }
      }
    } else {
      billingStreet = 'N/A';
    }

    paymentRequest.billingAddress = {
      city: billingAddress.city ? billingAddress.city : 'N/A',
      country: billingAddress.countryCode ? billingAddress.countryCode.value.toUpperCase() : 'ZZ',
      houseNumberOrName: billingHouseNumberOrName,
      postalCode: billingAddress.postalCode ? billingAddress.postalCode : '',
      stateOrProvince: billingAddress.stateCode ? billingAddress.stateCode : 'N/A',
      street: billingStreet
    };
    return paymentRequest;
  },
  createAdyenRequestObject: function createAdyenRequestObject(order, paymentInstrument) {
    var jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);
    var filteredJson = adyenHelperObj.validateStateData(jsonObject);
    var stateData = filteredJson.stateData;
    var reference = 'recurringPayment-account';
    var orderToken;

    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
      orderToken = order.getOrderToken();
    }

    stateData.merchantAccount = adyenHelperObj.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https('Adyen-ShowConfirmation', 'merchantReference', reference, 'orderToken', orderToken).toString();
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo(true);
    stateData.enableRecurring = adyenHelperObj.getAdyenRecurringEnabled();
    stateData.additionalData = {};
    return stateData;
  },
  add3DS2Data: function add3DS2Data(jsonObject) {
    jsonObject.additionalData.allow3DS2 = true;
    jsonObject.channel = 'web';
    var origin = "".concat(request.getHttpProtocol(), "://").concat(request.getHttpHost());
    jsonObject.origin = origin;
    jsonObject.threeDS2RequestData = {
      notificationURL: ''
    };
    return jsonObject;
  },
  getAdyenCardType: function getAdyenCardType(cardType) {
    if (!empty(cardType)) {
      switch (cardType) {
        case 'Visa':
          cardType = 'visa';
          break;

        case 'Master':
        case 'MasterCard':
        case 'Mastercard':
          cardType = 'mc';
          break;

        case 'Amex':
          cardType = 'amex';
          break;

        case 'Discover':
          cardType = 'discover';
          break;

        case 'Maestro':
          cardType = 'maestro';
          break;

        case 'Diners':
          cardType = 'diners';
          break;

        case 'Bancontact':
          cardType = 'bcmc';
          break;

        case 'JCB':
          cardType = 'jcb';
          break;

        case 'CUP':
          cardType = 'cup';
          break;

        default:
          cardType = cardType.toLowerCase();
          break;
      }
    } else {
      throw new Error('cardType argument is not passed to getAdyenCardType function');
    }

    return cardType;
  },
  getSFCCCardType: function getSFCCCardType(cardType) {
    if (!empty(cardType)) {
      switch (cardType) {
        case 'visa':
          cardType = 'Visa';
          break;

        case 'mc':
          cardType = 'Mastercard';
          break;

        case 'amex':
          cardType = 'Amex';
          break;

        case 'discover':
          cardType = 'Discover';
          break;

        case 'maestro':
        case 'maestrouk':
          cardType = 'Maestro';
          break;

        case 'diners':
          cardType = 'Diners';
          break;

        case 'bcmc':
          cardType = 'Bancontact';
          break;

        case 'jcb':
          cardType = 'JCB';
          break;

        case 'cup':
          cardType = 'CUP';
          break;

        default:
          cardType = '';
          break;
      }

      return cardType;
    }

    throw new Error('cardType argument is not passed to getSFCCCardType function');
  },
  savePaymentDetails: function savePaymentDetails(paymentInstrument, order, result) {
    if (result.pspReference) {
      paymentInstrument.paymentTransaction.transactionID = result.pspReference;
      order.custom.Adyen_pspReference = result.pspReference;
    }

    if (result.paymentMethod) {
      order.custom.Adyen_paymentMethod = result.paymentMethod;
    } else if (result.additionalData && result.additionalData.paymentMethod) {
      order.custom.Adyen_paymentMethod = result.additionalData.paymentMethod;
    }

    paymentInstrument.paymentTransaction.custom.authCode = result.resultCode ? result.resultCode : '';
    order.custom.Adyen_value = '0'; // Save full response to transaction custom attribute

    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(result);
    return true;
  },
  getCurrencyValueForApi: function getCurrencyValueForApi(amount) {
    var currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
    var digitsNumber = adyenHelperObj.getFractionDigits(currencyCode.toString());
    var value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties

    return new dw.value.Money(value, currencyCode);
  },
  getFractionDigits: function getFractionDigits(currencyCode) {
    var format;

    switch (currencyCode) {
      case 'CVE':
      case 'DJF':
      case 'GNF':
      case 'IDR':
      case 'JPY':
      case 'KMF':
      case 'KRW':
      case 'PYG':
      case 'RWF':
      case 'UGX':
      case 'VND':
      case 'VUV':
      case 'XAF':
      case 'XOF':
      case 'XPF':
        format = 0;
        break;

      case 'BHD':
      case 'IQD':
      case 'JOD':
      case 'KWD':
      case 'LYD':
      case 'OMR':
      case 'TND':
        format = 3;
        break;

      default:
        format = 2;
        break;
    }

    return format;
  },
  getApplicationInfo: function getApplicationInfo(isEcom) {
    var externalPlatformVersion = '';
    var applicationInfo = {};

    try {
      // AdyenController can be coming either from int_adyen_controllers
      // or int_adyen_SFRA, depending on the cartridge path
      var AdyenController = require('*/cartridge/controllers/Adyen.js');

      externalPlatformVersion = AdyenController.getExternalPlatformVersion;
    } catch (e) {
      /* no applicationInfo available */
    }

    applicationInfo.merchantApplication = {
      name: 'adyen-salesforce-commerce-cloud',
      version: adyenHelperObj.VERSION
    };
    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
      integrator: this.getSystemIntegratorName()
    };

    if (isEcom) {
      applicationInfo.adyenPaymentSource = {
        name: 'adyen-salesforce-commerce-cloud',
        version: adyenHelperObj.VERSION
      };
    }

    return applicationInfo;
  },
  validateStateData: function validateStateData(stateData) {
    var validFields = ['paymentMethod', 'billingAddress', ' deliveryAddress', 'riskData', 'shopperName', 'dateOfBirth', 'telephoneNumber', 'shopperEmail', 'countryCode', 'socialSecurityNumber', 'browserInfo', 'installments', 'storePaymentMethod', 'conversionId'];
    var invalidFields = [];
    var filteredStateData = {};
    var stateDataKeys = Object.keys(stateData);

    for (var i = 0; i < stateDataKeys.length; i++) {
      var keyName = stateDataKeys[i];
      var includesInvalidField = validFields.indexOf(keyName) === -1;

      if (includesInvalidField) {
        invalidFields.push(keyName);
      } else {
        filteredStateData[keyName] = stateData[keyName];
      }
    }

    return {
      stateData: filteredStateData,
      invalidFields: invalidFields
    };
  }
};
module.exports = adyenHelperObj;