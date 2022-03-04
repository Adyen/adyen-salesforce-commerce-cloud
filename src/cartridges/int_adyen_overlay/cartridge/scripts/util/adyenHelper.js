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
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
const dwsvc = require('dw/svc');
const dwsystem = require('dw/system');
const dwutil = require('dw/util');
const URLUtils = require('dw/web/URLUtils');
const Bytes = require('dw/util/Bytes');
const Logger = require('dw/system/Logger');
const MessageDigest = require('dw/crypto/MessageDigest');
const Encoding = require('dw/crypto/Encoding');
const CustomerMgr = require('dw/customer/CustomerMgr');
const {blockedPaymentMethods} = require('*/cartridge/scripts/config/blockedPaymentMethods.json');
const constants = require('*/cartridge/adyenConstants/constants');
const Transaction = require('dw/system/Transaction');
const adyenCurrentSite = dwsystem.Site.getCurrent();

/* eslint no-var: off */
var adyenHelperObj = {
  // service constants
  SERVICE: {
    PAYMENT: 'AdyenPayment',
    PAYMENTDETAILS: 'AdyenPaymentDetails',
    RECURRING: 'AdyenRecurring',
    RECURRING_DISABLE: 'AdyenRecurringDisable',
    SESSIONS: 'AdyenSessions',
    POSPAYMENT: 'AdyenPosPayment',
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

  CHECKOUT_COMPONENT_VERSION: '5.6.1',
  VERSION: '21.2.0',
  BLOCKED_PAYMENT_METHODS: blockedPaymentMethods,

  // Create the service config used to make calls to the Adyen Checkout API (used for all services)
  getService(service) {
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

  // returns SFCC customer object based on currentCustomer object
  // as retrieved from controller endpoint calls
  getCustomer(currentCustomer) {
    if (currentCustomer.profile) {
      return CustomerMgr.getCustomerByCustomerNumber(
          currentCustomer.profile.customerNo,
      );
    }
    return null;
  },

  // Retrieve a custom preference
  getCustomPreference(field) {
    let customPreference = null;
    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue(field)) {
      customPreference = adyenCurrentSite.getCustomPreferenceValue(field);
    }
    return customPreference;
  },

  // Get the current adyen environment mode (live or test)
  getAdyenEnvironment() {
    return adyenHelperObj.getCustomPreference('Adyen_Mode').value;
  },

  getAdyenMerchantAccount() {
    return adyenHelperObj.getCustomPreference('Adyen_merchantCode');
  },

  getAdyenSFRA6Compatibility() {
    return adyenHelperObj.getCustomPreference('Adyen_SFRA6_Compatibility');
  },

  // get the Adyen Url based on which environment is configured (live or test)
  getAdyenUrl() {
    let returnValue = '';
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

  getAdyen3DS2Enabled() {
    return adyenHelperObj.getCustomPreference('Adyen3DS2Enabled');
  },

  getAdyenGivingConfig(order) {
    const paymentMethod = order.custom.Adyen_paymentMethod;
    if (
      !adyenHelperObj.getAdyenGivingEnabled() ||
      !adyenHelperObj.isAdyenGivingAvailable(paymentMethod)
    ) {
      return null;
    }
    const givingConfigs = {};
    const configuredAmounts = adyenHelperObj.getDonationAmounts();
    givingConfigs.adyenGivingAvailable = true;
    givingConfigs.configuredAmounts = configuredAmounts;
    givingConfigs.charityName = adyenHelperObj.getAdyenGivingCharityName();
    givingConfigs.charityWebsite = adyenHelperObj.getAdyenGivingCharityWebsite();
    givingConfigs.charityDescription = adyenHelperObj.getAdyenGivingCharityDescription();
    givingConfigs.adyenGivingBackgroundUrl = adyenHelperObj.getAdyenGivingBackgroundUrl();
    givingConfigs.adyenGivingLogoUrl = adyenHelperObj.getAdyenGivingLogoUrl();

    givingConfigs.donationAmounts = JSON.stringify({
      currency: session.currency.currencyCode,
      values: configuredAmounts,
    });
    givingConfigs.pspReference = order.custom.Adyen_pspReference;
    for (const config in givingConfigs) {
      if (Object.prototype.hasOwnProperty.call(givingConfigs, config)) {
        if (givingConfigs[config] === null) {
          Logger.getLogger('Adyen').error(
              'Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly',
          );
          return null;
        }
      }
    }
    return givingConfigs;
  },

  getAdyenRecurringPaymentsEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenOneClickEnabled');
  },

  getCreditCardInstallments() {
    return adyenHelperObj.getCustomPreference('AdyenCreditCardInstallments');
  },

  getSystemIntegratorName: function () {
    return adyenHelperObj.getCustomPreference('Adyen_IntegratorName');
  },

  getAdyenClientKey() {
    return adyenHelperObj.getCustomPreference('Adyen_ClientKey');
  },

  getGoogleMerchantID() {
    return adyenHelperObj.getCustomPreference('Adyen_GooglePayMerchantID');
  },

  getAdyenStoreId() {
    return adyenHelperObj.getCustomPreference('Adyen_StoreId');
  },

  getAdyenApiKey() {
    return adyenHelperObj.getCustomPreference('Adyen_API_Key');
  },

  // get the URL for the checkout component based on the current Adyen component version
  getCheckoutUrl() {
    const checkoutUrl = this.getLoadingContext();
    return `${checkoutUrl}sdk/${adyenHelperObj.CHECKOUT_COMPONENT_VERSION}/adyen.js`;
  },

  // get the URL for the checkout component css based on the current Adyen component version
  getCheckoutCSS() {
    const checkoutCSS = this.getLoadingContext();
    return `${checkoutCSS}sdk/${adyenHelperObj.CHECKOUT_COMPONENT_VERSION}/adyen.css`;
  },

  // get the loading context based on the current environment (live or test)
  getLoadingContext() {
    let returnValue = '';
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

  // get the hash used to verify redirect requests
  getAdyenHash(value, salt) {
    const data = value + salt;
    const digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    const signature = Encoding.toHex(
      digestSHA512.digestBytes(new Bytes(data, 'UTF-8')),
    );

    return signature;
  },

  getAdyenBasketFieldsEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenBasketFieldsEnabled');
  },

  getAdyenCardholderNameEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenCardHolderName_enabled');
  },

  getAdyenLevel23DataEnabled: function () {
    return adyenHelperObj.getCustomPreference('AdyenLevel23DataEnabled');
  },

  getAdyenLevel23CommodityCode: function () {
    return adyenHelperObj.getCustomPreference('AdyenLevel23_CommodityCode');
  },

  getAdyenSalePaymentMethods: function () {
    return adyenHelperObj.getCustomPreference('AdyenSalePaymentMethods') ? adyenHelperObj.getCustomPreference('AdyenSalePaymentMethods').toString().split(',') : '';
  },

  getAdyenGivingEnabled() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_enabled');
  },

  getAdyenGivingCharityAccount() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityAccount');
  },

  getAdyenGivingCharityName() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityName');
  },

  getAdyenGivingCharityDescription() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityDescription');
  },

  getAdyenGivingCharityWebsite() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_charityUrl');
  },

  // returns an array containing the donation amounts configured in the custom preferences for Adyen Giving
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

  // get the preference value for the Adyen Giving charity background image URL
  getAdyenGivingBackgroundUrl() {
    return adyenHelperObj
      .getCustomPreference('AdyenGiving_backgroundUrl')?.getAbsURL();
  },

  // get the preference value for the Adyen Giving charity logo image URL
  getAdyenGivingLogoUrl() {
    return adyenHelperObj.getCustomPreference('AdyenGiving_logoUrl')?.getAbsURL();
  },

  // checks whether Adyen giving is available for the selected payment method
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

  // gets the ID for ratePay using the custom preference and the encoded session ID
  getRatePayID: function getRatePayID() {
    var returnValue = {};
    if (adyenCurrentSite && adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID')) {
      returnValue.ratePayId = adyenCurrentSite.getCustomPreferenceValue('AdyenRatePayID');
    }

    if (!session.privacy.ratePayFingerprint || session.privacy.ratePayFingerprint === null) {
      var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
      returnValue.sessionID = Encoding.toHex(digestSHA512.digestBytes(new Bytes(session.sessionID, 'UTF-8')));
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
      paymentMethod === 'zip' ||
      paymentMethod === 'affirm' ||
      paymentMethod === 'clearpay'
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

  // Get stored card token of customer saved card based on matched cardUUID
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

  // populates and returns the args paymentRequest with shopper information using the order contains in the args object itself
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

    const address = args.order.getBillingAddress() || args.order.getDefaultShipment().getShippingAddress();
    const shopperDetails = {
      firstName: address.firstName,
      gender,
      infix: '',
      lastName: address.lastName,
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

  // populates the paymentRequest with address information using the order and payment method and returns it
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

  // creates a request object to send to the Adyen Checkout API
  createAdyenRequestObject(order, paymentInstrument) {
    const jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);

    const filteredJson = adyenHelperObj.validateStateData(jsonObject);
    const { stateData } = filteredJson;
    let reference = 'recurringPayment-account';
    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
    }

    let signature = '';
    //Create signature to verify returnUrl if there is an order
    if (order && order.getUUID()) {
      signature = adyenHelperObj.createSignature(paymentInstrument, order.getUUID(), reference);
    }

    if(stateData.paymentMethod?.storedPaymentMethodId) {
      stateData.recurringProcessingModel = 'CardOnFile';
      stateData.shopperInteraction = 'ContAuth';
    } else {
        stateData.shopperInteraction = 'Ecommerce';
    }

    stateData.merchantAccount = adyenHelperObj.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https(
      'Adyen-ShowConfirmation',
      'merchantReference',
      reference,
      'signature',
      signature
    ).toString();
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo();

    stateData.additionalData = {};
    return stateData;
  },

  createSignature(paymentInstrument, value, salt){
    const newSignature = adyenHelperObj.getAdyenHash(value, salt);
    Transaction.wrap(function(){
      paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = newSignature;
    })
    return newSignature;
  },

  // adds 3DS2 fields to an Adyen Checkout payments Request
  add3DS2Data(jsonObject) {
    jsonObject.additionalData.allow3DS2 = true;
    jsonObject.channel = 'web';

    const origin = `${request.getHttpProtocol()}://${request.getHttpHost()}`;
    jsonObject.origin = origin;
    jsonObject.threeDS2RequestData = { notificationURL: '' };

    return jsonObject;
  },

  // gets the SFCC card type name based on the Adyen card type name
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

  // gets the Adyen card type name based on the SFCC card type name
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

  // saves the payment details in the paymentInstrument's custom object
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
    order.custom.Adyen_value = '0';
    // Save full response to transaction custom attribute
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(
      result,
    );

    return true;
  },

  // converts the currency value for the Adyen Checkout API
  getCurrencyValueForApi(amount) {
    const currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
    const digitsNumber = adyenHelperObj.getFractionDigits(
      currencyCode.toString(),
    );
    const value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties
    return new dw.value.Money(value, currencyCode);
  },

  // get the fraction digits based on the currency code used to convert amounts of currency for the Adyen Checkout API
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

  getApplicationInfo() {
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
      version: adyenHelperObj.VERSION,
    };

    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
      integrator: this.getSystemIntegratorName(),
    };

    return applicationInfo;
  },

  // validates all fields in a state data object. Filters out all invalid fields
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

  createAdyenCheckoutResponse(checkoutresponse) {
    if (
        [constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.REFUSED, constants.RESULTCODES.ERROR, constants.RESULTCODES.CANCELLED].indexOf(
            checkoutresponse.resultCode,
        ) !== -1
    ) {
      return {
        isFinal: true,
        isSuccessful: checkoutresponse.resultCode === constants.RESULTCODES.AUTHORISED,
        merchantReference: checkoutresponse.merchantReference,
      }
    }

    if (
        [
          constants.RESULTCODES.REDIRECTSHOPPER,
          constants.RESULTCODES.IDENTIFYSHOPPER,
          constants.RESULTCODES.CHALLENGESHOPPER,
          constants.RESULTCODES.PRESENTTOSHOPPER,
          constants.RESULTCODES.PENDING,
        ].indexOf(checkoutresponse.resultCode) !== -1
    ) {
      return {
        isFinal: false,
        action: checkoutresponse.action || checkoutresponse.fullResponse.action,
      };
    }

    if (checkoutresponse.resultCode === 'Received') {
      return {
        isFinal: false,
      };
    }

    dwsystem.Logger.getLogger('Adyen').error(
        `Unknown resultCode: ${checkoutresponse.resultCode}.`,
    );
    return {
      isFinal: true,
      isSuccessful: false,
    };
  },
};

module.exports = adyenHelperObj;
