/**
 *
 */
const dwsvc = require('dw/svc');
const dwsystem = require('dw/system');
const dwutil = require('dw/util');
const URLUtils = require('dw/web/URLUtils');

const adyenCurrentSite = dwsystem.Site.getCurrent();

/* eslint no-var: off */
var adyenHelperObj = {
  // service constants
  SERVICE: {
    PAYMENT: 'AdyenPayment',
    PAYMENTDETAILS: 'AdyenPaymentDetails',
    PAYMENT_3DSECURE: 'AdyenPayment3DSecure',
    RECURRING: 'AdyenRecurring',
    RECURRING_DISABLE: 'AdyenRecurringDisable',
    PAYMENTMETHODS: 'AdyenPaymentMethods',
    POSPAYMENT: 'AdyenPosPayment',
    ORIGINKEYS: 'AdyenOriginKeys',
    CHECKOUTPAYMENTMETHODS: 'AdyenCheckoutPaymentMethods',
    CONNECTEDTERMINALS: 'AdyenConnectedTerminals',
    ADYENGIVING: 'AdyenGiving',
  },
  MODE: {
    TEST: 'TEST',
    LIVE: 'LIVE',
  },

  ADYEN_LIVE_URL: 'https://live.adyen.com/',
  ADYEN_TEST_URL: 'https://test.adyen.com/',
  LOADING_CONTEXT_TEST:
    'https://checkoutshopper-test.adyen.com/checkoutshopper/',
  LOADING_CONTEXT_LIVE:
    'https://checkoutshopper-live.adyen.com/checkoutshopper/',

  CHECKOUT_COMPONENT_VERSION: '3.9.4',
  VERSION: '20.1.3',

  getService: function (service) {
    // Create the service config (used for all services)
    var adyenService = null;

    try {
      adyenService = dwsvc.LocalServiceRegistry.createService(service, {
        createRequest: function (svc, args) {
          svc.setRequestMethod('POST');
          if (args) {
            return args;
          }
          return null;
        },
        parseResponse: function (svc, client) {
          return client;
        },
        filterLogMessage: function (msg) {
          return msg;
        },
      });
      dwsystem.Logger.getLogger('Adyen', 'adyen').debug(
        'Successfully retrive service with name {0}',
        service,
      );
    } catch (e) {
      dwsystem.Logger.getLogger('Adyen', 'adyen').error(
        "Can't get service instance with name {0}",
        service,
      );
      // e.message
    }
    return adyenService;
  },

  getCustomPreference: function (field) {
    let customPreference = null;
    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
      customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
    }
    return customPreference;
  },

  getAdyenEnvironment: function () {
    return adyenHelperObj.getCustomPreference('Adyen_Mode').value;
  },

  getAdyenMerchantAccount: function () {
    return adyenHelperObj.getCustomPreference('Adyen_merchantCode');
  },

  getAdyenSecuredFieldsEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenSecuredFieldsEnabled');
  },

  getAdyen3DS2Enabled: function () {
    return adyenHelperObj.getCustomPreference('Adyen3DS2Enabled');
  },

  getAdyenRecurringPaymentsEnabled: function () {
    let returnValue = false;
    if (
      !empty(adyenCurrentSite)
      && (adyenCurrentSite.getCustomPreferenceValue('AdyenRecurringEnabled')
        || adyenCurrentSite.getCustomPreferenceValue('AdyenOneClickEnabled'))
    ) {
      returnValue = true;
    }
    return returnValue;
  },

  getAdyenGivingConfig: function (order) {
    const paymentMethod = order.custom.Adyen_paymentMethod;
    let adyenGivingAvailable = false;
    if (
      adyenHelperObj.getAdyenGivingEnabled()
      && adyenHelperObj.isAdyenGivingAvailable(paymentMethod)
    ) {
      adyenGivingAvailable = true;
      var configuredAmounts = adyenHelperObj.getDonationAmounts();
      var charityName = adyenHelperObj.getAdyenGivingCharityName();
      var charityWebsite = adyenHelperObj.getAdyenGivingCharityWebsite();
      var charityDescription = adyenHelperObj.getAdyenGivingCharityDescription();
      var adyenGivingBackgroundUrl = adyenHelperObj.getAdyenGivingBackgroundUrl();
      var adyenGivingLogoUrl = adyenHelperObj.getAdyenGivingLogoUrl();

      var donationAmounts = {
        currency: session.currency.currencyCode,
        values: configuredAmounts,
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
      pspReference: order.custom.Adyen_pspReference,
    };
  },

  getAdyenRecurringEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenRecurringEnabled');
  },

  getAdyenOneClickEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenOneClickEnabled');
  },

  getCreditCardInstallments: function () {
    return adyenHelperObj.getCustomPreference('AdyenCreditCardInstallments');
  },

  getSystemIntegratorName: function () {
    return adyenHelperObj.getCustomPreference('Adyen_IntegratorName');
  },

  getPaypalMerchantID: function () {
    return adyenHelperObj.getCustomPreference('Adyen_PaypalMerchantID');
  },

  getGoogleMerchantID: function () {
    return adyenHelperObj.getCustomPreference('Adyen_GooglePayMerchantID');
  },

  getAdyenStoreId: function () {
    return adyenHelperObj.getCustomPreference('Adyen_StoreId');
  },

  getAdyenApiKey: function () {
    return adyenHelperObj.getCustomPreference('Adyen_API_Key');
  },

  getCheckoutUrl: function () {
    const checkoutUrl = `${this.getLoadingContext()
    }sdk/${
      adyenHelperObj.CHECKOUT_COMPONENT_VERSION
    }/adyen.js`;
    return checkoutUrl;
  },

  getCheckoutCSS: function () {
    const checkoutCSS = `${this.getLoadingContext()
    }sdk/${
      adyenHelperObj.CHECKOUT_COMPONENT_VERSION
    }/adyen.css`;
    return checkoutCSS;
  },

  getLoadingContext: function () {
    let returnValue = '';
    /* eslint default-case: ["error", { "commentPattern": "^skip\\sdefault" }] */
    switch (adyenHelperObj.getAdyenEnvironment()) {
      case adyenHelperObj.MODE.TEST:
        returnValue = adyenHelperObj.LOADING_CONTEXT_TEST;
        break;
      case adyenHelperObj.MODE.LIVE:
        returnValue = adyenHelperObj.LOADING_CONTEXT_LIVE;
        break;
        // skip default
    }
    return returnValue;
  },

  getAdyenHash: function (value, salt) {
    const data = value + salt;
    const Bytes = require('dw/util/Bytes');
    const MessageDigest = require('dw/crypto/MessageDigest');
    const Encoding = require('dw/crypto/Encoding');
    const digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    const signature = Encoding.toHex(
      digestSHA512.digestBytes(new Bytes(data, 'UTF-8')),
    );

    return signature;
  },

  getAdyenBasketFieldsEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenBasketFieldsEnabled');
  },

  getAdyenLevel23DataEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenLevel23DataEnabled');
  },

  getAdyenLevel23CommodityCode: function () {
    return adyenHelperObj.getCustomPreference('AdyenLevel23_CommodityCode');
  },

  getAdyenGivingEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_enabled');
  },

  getAdyenGivingCharityAccount: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityAccount');
  },

  getAdyenGivingCharityName: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityName');
  },

  getAdyenGivingCharityDescription: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityDescription');
  },

  getAdyenGivingCharityWebsite: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityUrl');
  },

  getDonationAmounts: function () {
    let returnValue = [];
    if (
      !empty(adyenCurrentSite)
      && !empty(
        adyenCurrentSite.getCustomPreferenceValue('AdyenGiving_donationAmounts'),
      )
    ) {
      const configuredValue = adyenCurrentSite.getCustomPreferenceValue(
        'AdyenGiving_donationAmounts',
      );
      const configuredAmountArray = configuredValue.split(',');
      const amountArray = [];
      for (let i = 0; i < configuredAmountArray.length; i++) {
        /* eslint radix: ["error", "as-needed"] */
        const amount = parseInt(configuredAmountArray[i]);
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(amount)) {
          amountArray.push(amount);
        }
      }
      returnValue = amountArray;
    }
    return returnValue;
  },

  getAdyenGivingBackgroundUrl: function () {
    return adyenHelperObj
      .getCustomPreference('AdyenGiving_backgroundUrl')
      .getAbsURL();
  },

  getAdyenGivingLogoUrl: function () {
    return adyenHelperObj.getCustomPreference('AdyenGiving_logoUrl').getAbsURL();
  },

  isAdyenGivingAvailable: function (paymentMethod) {
    const availablePaymentMethods = [
      'visa',
      'mc',
      'amex',
      'cup',
      'jcb',
      'diners',
      'discover',
      'cartebancaire',
      'bcmc',
      'ideal',
      'giropay',
      'directEbanking',
      'vipps',
      'sepadirectdebit',
      'directdebit_GB',
    ];
    return availablePaymentMethods.indexOf(paymentMethod) !== -1;
  },

  getRatePayID: function () {
    const returnValue = {};
    if (
      adyenCurrentSite
      && adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID')
    ) {
      returnValue.ratePayId = adyenCurrentSite.getCustomPreferenceValue(
        'AdyenRatePayID',
      );
    }
    if (
      !session.privacy.ratePayFingerprint
      || session.privacy.ratePayFingerprint === null
    ) {
      returnValue.sessionID = new dw.crypto.MessageDigest(
        dw.crypto.MessageDigest.DIGEST_SHA_256,
      ).digest(session.sessionID);
      session.privacy.ratePayFingerprint = returnValue.sessionID;
    }
    return returnValue;
  },

  isOpenInvoiceMethod: function (paymentMethod) {
    if (
      paymentMethod.indexOf('afterpay') > -1
      || paymentMethod.indexOf('klarna') > -1
      || paymentMethod.indexOf('ratepay') > -1
      || paymentMethod.indexOf('facilypay') > -1
      || paymentMethod === 'zip'
      || paymentMethod === 'affirm'
        || paymentMethod === 'clearpay'
    ) {
      return true;
    }
    return false;
  },

  isMolpayMethod: function (paymentMethod) {
    if (paymentMethod.indexOf('molpay') > -1) {
      return true;
    }

    return false;
  },

  // Get saved card token of customer saved card based on matched cardUUID
  getCardToken: function (cardUUID, customer) {
    let token = '';
    if (customer && customer.authenticated && cardUUID) {
      const wallet = customer.getProfile().getWallet();
      const paymentInstruments = wallet.getPaymentInstruments();
      let creditCardInstrument;
      const instrumentsIter = paymentInstruments.iterator();
      while (instrumentsIter.hasNext()) {
        creditCardInstrument = instrumentsIter.next();
        // find token ID exists for matching payment card
        if (
          creditCardInstrument.UUID.equals(cardUUID)
          && creditCardInstrument.getCreditCardToken()
        ) {
          token = creditCardInstrument.getCreditCardToken();
          break;
        }
      }
    }
    return token;
  },

  createShopperObject: function (args) {
    let gender = 'UNKNOWN';
    if (
      args.paymentRequest.shopperName
      && args.paymentRequest.shopperName.gender
    ) {
      gender = args.paymentRequest.shopperName.gender;
    }

    if (args.order.getDefaultShipment().getShippingAddress().getPhone()) {
      args.paymentRequest.telephoneNumber = args.order.getDefaultShipment().getShippingAddress().getPhone();
    }

    const customer = args.order.getCustomer();
    const profile = customer && customer.registered && customer.getProfile()
      ? customer.getProfile()
      : null;

    if (args.order.customerEmail) {
      args.paymentRequest.shopperEmail = args.order.customerEmail;
    }
    if (!args.order.customerEmail && profile && profile.getEmail()) {
      args.paymentRequest.shopperEmail = profile.getEmail();
    }

    const shopperDetails = {
      firstName: args.order.getBillingAddress().firstName,
      gender: gender,
      infix: '',
      lastName: args.order.getBillingAddress().lastName,
    };
    args.paymentRequest.shopperName = shopperDetails;

    if (profile && profile.getCustomerNo()) {
      args.paymentRequest.shopperReference = profile.getCustomerNo();
    } else if (args.order.getCustomerNo()) {
      args.paymentRequest.shopperReference = args.order.getCustomerNo();
    }

    const shopperIP = request.getHttpRemoteAddress()
      ? request.getHttpRemoteAddress()
      : null;
    if (shopperIP) {
      args.paymentRequest.shopperIP = shopperIP;
    }

    if (request.getLocale()) {
      args.paymentRequest.shopperLocale = request.getLocale();
    }

    return args.paymentRequest;
  },

  createAddressObjects: function (order, paymentMethod, paymentRequest) {
    const shippingAddress = order.defaultShipment.shippingAddress;
    paymentRequest.countryCode = shippingAddress.countryCode.value.toUpperCase();

    let shippingStreet = '';
    let shippingHouseNumberOrName = '';

    if (shippingAddress.address1) {
      shippingStreet = shippingAddress.address1;
      if (shippingAddress.address2) {
        shippingHouseNumberOrName = shippingAddress.address2;
        if (paymentMethod.indexOf('afterpaytouch') > -1) {
          shippingHouseNumberOrName = '';
          shippingStreet += ` ${shippingAddress.address2}`;
        }
      }
    } else {
      shippingStreet = 'N/A';
    }

    paymentRequest.deliveryAddress = {
      city: shippingAddress.city ? shippingAddress.city : 'N/A',
      country: shippingAddress.countryCode
        ? shippingAddress.countryCode.value.toUpperCase()
        : 'ZZ',
      houseNumberOrName: shippingHouseNumberOrName,
      postalCode: shippingAddress.postalCode ? shippingAddress.postalCode : '',
      stateOrProvince: shippingAddress.stateCode
        ? shippingAddress.stateCode
        : 'N/A',
      street: shippingStreet,
    };

    const billingAddress = order.getBillingAddress();
    let billingStreet = '';
    let billingHouseNumberOrName = '';

    if (billingAddress.address1) {
      billingStreet = billingAddress.address1;
      if (billingAddress.address2) {
        billingHouseNumberOrName = billingAddress.address2;
        if (paymentMethod.indexOf('afterpaytouch') > -1) {
          billingHouseNumberOrName = '';
          billingStreet += ` ${billingAddress.address2}`;
        }
      }
    } else {
      billingStreet = 'N/A';
    }

    paymentRequest.billingAddress = {
      city: billingAddress.city ? billingAddress.city : 'N/A',
      country: billingAddress.countryCode
        ? billingAddress.countryCode.value.toUpperCase()
        : 'ZZ',
      houseNumberOrName: billingHouseNumberOrName,
      postalCode: billingAddress.postalCode ? billingAddress.postalCode : '',
      stateOrProvince: billingAddress.stateCode
        ? billingAddress.stateCode
        : 'N/A',
      street: billingStreet,
    };

    return paymentRequest;
  },

  createAdyenRequestObject: function (order, paymentInstrument) {
    const jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);
    const filteredJson = adyenHelperObj.validateStateData(jsonObject);
    const stateData = filteredJson.stateData;

    let reference = 'recurringPayment-account';
    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
    }

    stateData.merchantAccount = adyenHelperObj.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https(
      'Adyen-ShowConfirmation',
      'merchantReference',
      reference,
      'orderToken',
      order.getOrderToken(),
    ).toString();
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo(true);
    stateData.enableRecurring = adyenHelperObj.getAdyenRecurringEnabled();
    stateData.additionalData = {};
    return stateData;
  },

  add3DS2Data: function (jsonObject) {
    jsonObject.additionalData.allow3DS2 = true;
    jsonObject.channel = 'web';

    const origin = `${request.getHttpProtocol()}://${request.getHttpHost()}`;
    jsonObject.origin = origin;
    jsonObject.threeDS2RequestData = { notificationURL: '' };

    return jsonObject;
  },

  getAdyenCardType: function (cardType) {
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
      throw new Error(
        'cardType argument is not passed to getAdyenCardType function',
      );
    }

    return cardType;
  },

  getSFCCCardType: function (cardType) {
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
    throw new Error(
      'cardType argument is not passed to getSFCCCardType function',
    );
  },

  savePaymentDetails: function (paymentInstrument, order, result) {
    if (result.pspReference) {
      paymentInstrument.paymentTransaction.transactionID = result.pspReference;
      order.custom.Adyen_pspReference = result.pspReference;
    }
    if (result.paymentMethod) {
      order.custom.Adyen_paymentMethod = result.paymentMethod;
    } else if (result.additionalData && result.additionalData.paymentMethod) {
      order.custom.Adyen_paymentMethod = result.additionalData.paymentMethod;
    }

    paymentInstrument.paymentTransaction.custom.authCode = result.resultCode
      ? result.resultCode
      : '';
    order.custom.Adyen_value = result.adyenAmount
      ? result.adyenAmount.toFixed(0)
      : '';

    // Save full response to transaction custom attribute
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(
      result,
    );

    return true;
  },

  getCurrencyValueForApi: function (amount) {
    const currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
    const digitsNumber = adyenHelperObj.getFractionDigits(
      currencyCode.toString(),
    );
    const value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties
    return new dw.value.Money(value, currencyCode);
  },

  getFractionDigits: function (currencyCode) {
    let format;
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

  getApplicationInfo: function (isEcom) {
    let externalPlatformVersion = '';
    const applicationInfo = {};
    try {
      // AdyenController can be coming either from int_adyen_controllers or int_adyen_SFRA, depending on the cartridge path
      const AdyenController = require('*/cartridge/controllers/Adyen.js');
      externalPlatformVersion = AdyenController.getExternalPlatformVersion;
    } catch (e) {
      /* no applicationInfo available */
    }

    applicationInfo.merchantApplication = {
      name: 'adyen-salesforce-commerce-cloud',
      version: adyenHelperObj.VERSION,
    };

    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
      integrator: this.getSystemIntegratorName(),
    };

    if (isEcom) {
      applicationInfo.adyenPaymentSource = {
        name: 'adyen-salesforce-commerce-cloud',
        version: adyenHelperObj.VERSION,
      };
    }

    return applicationInfo;
  },

  validateStateData: function (stateData) {
    const validFields = [
      'paymentMethod',
      'billingAddress',
      ' deliveryAddress',
      'riskData',
      'shopperName',
      'dateOfBirth',
      'telephoneNumber',
      'shopperEmail',
      'countryCode',
      'socialSecurityNumber',
      'browserInfo',
      'installments',
      'storePaymentMethod',
      'conversionId',
    ];
    const invalidFields = [];
    const filteredStateData = {};
    const stateDataKeys = Object.keys(stateData);
    for (let i = 0; i < stateDataKeys.length; i++) {
      const keyName = stateDataKeys[i];
      const includesInvalidField = validFields.indexOf(keyName) === -1;
      if (includesInvalidField) {
        invalidFields.push(keyName);
      } else {
        filteredStateData[keyName] = stateData[keyName];
      }
    }
    return { stateData: filteredStateData, invalidFields: invalidFields };
  },
};

module.exports = adyenHelperObj;
