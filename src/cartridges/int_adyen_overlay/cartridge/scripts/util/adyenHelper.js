/**
 *
 */
const dwsvc = require('dw/svc');
const dwsystem = require('dw/system');
const dwutil = require('dw/util');
const URLUtils = require('dw/web/URLUtils');

const adyenCurrentSite = dwsystem.Site.getCurrent();

/* eslint no-var: off */
var __AdyenHelper = {
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
  VERSION: '20.1.0',

  getService(service) {
    // Create the service config (used for all services)
    var adyenService = null;

    try {
      adyenService = dwsvc.LocalServiceRegistry.createService(service, {
        createRequest(svc, args) {
          svc.setRequestMethod('POST');
          if (args) {
            return args;
          }
          return null;
        },
        parseResponse(svc, client) {
          return client;
        },
        filterLogMessage(msg) {
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

  getCustomPreference(field) {
    let customPreference = null;
    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
      customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
    }
    return customPreference;
  },

  getAdyenEnvironment() {
    return __AdyenHelper.getCustomPreference('Adyen_Mode').value;
  },

  getAdyenMerchantAccount() {
    return __AdyenHelper.getCustomPreference('Adyen_merchantCode');
  },

  getAdyenUrl() {
    let returnValue = '';
    switch (__AdyenHelper.getAdyenEnvironment()) {
      case __AdyenHelper.MODE.TEST:
        returnValue = __AdyenHelper.ADYEN_TEST_URL;
        break;
      case __AdyenHelper.MODE.LIVE:
        returnValue = __AdyenHelper.ADYEN_LIVE_URL;
        break;
    }
    return returnValue;
  },

  getAdyenSecuredFieldsEnabled() {
    return __AdyenHelper.getCustomPreference('AdyenSecuredFieldsEnabled');
  },

  getAdyen3DS2Enabled() {
    return __AdyenHelper.getCustomPreference('Adyen3DS2Enabled');
  },

  getAdyenRecurringPaymentsEnabled() {
    let returnValue = false;
    if (
      !empty(adyenCurrentSite) &&
      (adyenCurrentSite.getCustomPreferenceValue('AdyenRecurringEnabled') ||
        adyenCurrentSite.getCustomPreferenceValue('AdyenOneClickEnabled'))
    ) {
      returnValue = true;
    }
    return returnValue;
  },

  getAdyenGivingConfig(order) {
    const paymentMethod = order.custom.Adyen_paymentMethod;
    let adyenGivingAvailable = false;
    if (
      __AdyenHelper.getAdyenGivingEnabled() &&
      __AdyenHelper.isAdyenGivingAvailable(paymentMethod)
    ) {
      adyenGivingAvailable = true;
      var configuredAmounts = __AdyenHelper.getDonationAmounts();
      var charityName = __AdyenHelper.getAdyenGivingCharityName();
      var charityWebsite = __AdyenHelper.getAdyenGivingCharityWebsite();
      var charityDescription = __AdyenHelper.getAdyenGivingCharityDescription();
      var adyenGivingBackgroundUrl = __AdyenHelper.getAdyenGivingBackgroundUrl();
      var adyenGivingLogoUrl = __AdyenHelper.getAdyenGivingLogoUrl();

      var donationAmounts = {
        currency: session.currency.currencyCode,
        values: configuredAmounts,
      };
    }
    return {
      adyenGivingAvailable,
      configuredAmounts,
      charityName,
      charityWebsite,
      charityDescription,
      adyenGivingBackgroundUrl,
      adyenGivingLogoUrl,
      donationAmounts: JSON.stringify(donationAmounts),
      pspReference: order.custom.Adyen_pspReference,
    };
  },

  getAdyenRecurringEnabled() {
    return __AdyenHelper.getCustomPreference('AdyenRecurringEnabled');
  },

  getAdyenOneClickEnabled() {
    return __AdyenHelper.getCustomPreference('AdyenOneClickEnabled');
  },

  getCreditCardInstallments() {
    return __AdyenHelper.getCustomPreference('AdyenCreditCardInstallments');
  },

  getPaypalMerchantID() {
    return __AdyenHelper.getCustomPreference('Adyen_PaypalMerchantID');
  },

  getAdyenStoreId() {
    return __AdyenHelper.getCustomPreference('Adyen_StoreId');
  },

  getAdyenApiKey() {
    return __AdyenHelper.getCustomPreference('Adyen_API_Key');
  },

  getCheckoutUrl() {
    const checkoutUrl = this.getLoadingContext();
    `sdk/${__AdyenHelper.CHECKOUT_COMPONENT_VERSION}/adyen.js`;
    return checkoutUrl;
  },

  getCheckoutCSS() {
    const checkoutCSS = this.getLoadingContext();
    `sdk/${__AdyenHelper.CHECKOUT_COMPONENT_VERSION}/adyen.css`;
    return checkoutCSS;
  },

  getLoadingContext() {
    let returnValue = '';
    switch (__AdyenHelper.getAdyenEnvironment()) {
      case __AdyenHelper.MODE.TEST:
        returnValue = __AdyenHelper.LOADING_CONTEXT_TEST;
        break;
      case __AdyenHelper.MODE.LIVE:
        returnValue = __AdyenHelper.LOADING_CONTEXT_LIVE;
        break;
    }
    return returnValue;
  },

  getAdyenHash(value, salt) {
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

  getAdyenBasketFieldsEnabled() {
    return __AdyenHelper.getCustomPreference('AdyenBasketFieldsEnabled');
  },

  getAdyenGivingEnabled() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_enabled');
  },

  getAdyenGivingCharityAccount() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_charityAccount');
  },

  getAdyenGivingCharityName() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_charityName');
  },

  getAdyenGivingCharityDescription() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_charityDescription');
  },

  getAdyenGivingCharityWebsite() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_charityUrl');
  },

  getDonationAmounts() {
    let returnValue = [];
    if (
      !empty(adyenCurrentSite) &&
      !empty(
        adyenCurrentSite.getCustomPreferenceValue(
          'AdyenGiving_donationAmounts',
        ),
      )
    ) {
      const configuredValue = adyenCurrentSite.getCustomPreferenceValue(
        'AdyenGiving_donationAmounts',
      );
      const configuredAmountArray = configuredValue.split(',');
      const amountArray = [];
      for (let i = 0; i < configuredAmountArray.length; i++) {
        const amount = parseInt(configuredAmountArray[i]);
        if (!isNaN(amount)) {
          amountArray.push(amount);
        }
      }
      returnValue = amountArray;
    }
    return returnValue;
  },

  getAdyenGivingBackgroundUrl() {
    return __AdyenHelper
      .getCustomPreference('AdyenGiving_backgroundUrl')
      .getAbsURL();
  },

  getAdyenGivingLogoUrl() {
    return __AdyenHelper.getCustomPreference('AdyenGiving_logoUrl').getAbsURL();
  },

  isAdyenGivingAvailable(paymentMethod) {
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

  getRatePayID() {
    const returnValue = {};
    if (
      adyenCurrentSite &&
      adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID')
    ) {
      returnValue.ratePayId = adyenCurrentSite.getCustomPreferenceValue(
        'AdyenRatePayID',
      );
    }
    if (
      !session.privacy.ratePayFingerprint ||
      session.privacy.ratePayFingerprint === null
    ) {
      returnValue.sessionID = new dw.crypto.MessageDigest(
        dw.crypto.MessageDigest.DIGEST_SHA_256,
      ).digest(session.sessionID);
      session.privacy.ratePayFingerprint = returnValue.sessionID;
    }
    return returnValue;
  },

  isOpenInvoiceMethod(paymentMethod) {
    if (
      paymentMethod.indexOf('afterpay') > -1 ||
      paymentMethod.indexOf('klarna') > -1 ||
      paymentMethod.indexOf('ratepay') > -1 ||
      paymentMethod.indexOf('facilypay') > -1 ||
      paymentMethod === 'zip'
    ) {
      return true;
    }
    return false;
  },

  isMolpayMethod(paymentMethod) {
    if (paymentMethod.indexOf('molpay') > -1) {
      return true;
    }

    return false;
  },

  // Get saved card token of customer saved card based on matched cardUUID
  getCardToken(cardUUID, customer) {
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
          creditCardInstrument.UUID.equals(cardUUID) &&
          creditCardInstrument.getCreditCardToken()
        ) {
          token = creditCardInstrument.getCreditCardToken();
          break;
        }
      }
    }
    return token;
  },

  createShopperObject(args) {
    let gender = 'UNKNOWN';
    if (
      args.paymentRequest.shopperName &&
      args.paymentRequest.shopperName.gender
    ) {
      gender = args.paymentRequest.shopperName.gender;
    }

    if (args.order.getDefaultShipment().getShippingAddress().getPhone()) {
      args.paymentRequest.telephoneNumber = args.order
        .getDefaultShipment()
        .getShippingAddress()
        .getPhone();
    }

    const customer = args.order.getCustomer();
    const profile =
      customer && customer.registered && customer.getProfile()
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
      gender,
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

  createAddressObjects(order, paymentMethod, paymentRequest) {
    const { shippingAddress } = order.defaultShipment;
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

  createAdyenRequestObject(order, paymentInstrument) {
    const jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);
    const filteredJson = __AdyenHelper.validateStateData(jsonObject);
    const { stateData } = filteredJson;

    let reference = 'recurringPayment-account';
    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
    }

    stateData.merchantAccount = __AdyenHelper.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https('Adyen-ShowConfirmation').toString();
    stateData.applicationInfo = __AdyenHelper.getApplicationInfo(true);
    stateData.enableRecurring = __AdyenHelper.getAdyenRecurringEnabled();
    stateData.additionalData = {};
    return stateData;
  },

  add3DS2Data(jsonObject) {
    jsonObject.additionalData.allow3DS2 = true;
    jsonObject.channel = 'web';

    const origin = `${request.getHttpProtocol()}://${request.getHttpHost()}`;
    jsonObject.origin = origin;
    jsonObject.threeDS2RequestData = { notificationURL: '' };

    return jsonObject;
  },

  getAdyenCardType(cardType) {
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

  getSFCCCardType(cardType) {
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

  savePaymentDetails(paymentInstrument, order, result) {
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

  getCurrencyValueForApi(amount) {
    const currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
    const digitsNumber = __AdyenHelper.getFractionDigits(
      currencyCode.toString(),
    );
    return Math.round(amount.multiply(Math.pow(10, digitsNumber)).value);
  },

  getFractionDigits(currencyCode) {
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

  getApplicationInfo(isEcom) {
    let externalPlatformVersion = '';
    const applicationInfo = {};
    try {
      // AdyenController can be coming either from int_adyen_controllers
      // or int_adyen_SFRA, depending on the cartridge path
      const AdyenController = require('*/cartridge/controllers/Adyen.js');
      externalPlatformVersion = AdyenController.getExternalPlatformVersion;
    } catch (e) {
      /* no applicationInfo available */
    }

    applicationInfo.merchantApplication = {
      name: 'adyen-salesforce-commerce-cloud',
      version: __AdyenHelper.VERSION,
    };

    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
    };

    if (isEcom) {
      applicationInfo.adyenPaymentSource = {
        name: 'adyen-salesforce-commerce-cloud',
        version: __AdyenHelper.VERSION,
      };
    }
    return applicationInfo;
  },

  validateStateData(stateData) {
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
    return { stateData: filteredStateData, invalidFields };
  },
};

module.exports = __AdyenHelper;
