"use strict";

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
var dwsvc = require('dw/svc');

var dwsystem = require('dw/system');

var dwutil = require('dw/util');

var URLUtils = require('dw/web/URLUtils');

var Bytes = require('dw/util/Bytes');

var Logger = require('dw/system/Logger');

var MessageDigest = require('dw/crypto/MessageDigest');

var Encoding = require('dw/crypto/Encoding');

var CustomerMgr = require('dw/customer/CustomerMgr');

var constants = require('*/cartridge/adyenConstants/constants');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var Transaction = require('dw/system/Transaction');
/* eslint no-var: off */


var adyenHelperObj = {
  // Create the service config used to make calls to the Adyen Checkout API (used for all services)
  getService: function getService(service) {
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
  // returns SFCC customer object based on currentCustomer object
  // as retrieved from controller endpoint calls
  getCustomer: function getCustomer(currentCustomer) {
    if (currentCustomer.profile) {
      return CustomerMgr.getCustomerByCustomerNumber(currentCustomer.profile.customerNo);
    }

    return null;
  },
  // get the Adyen Url based on which environment is configured (live or test)
  getAdyenUrl: function getAdyenUrl() {
    var returnValue = '';

    switch (AdyenConfigs.getAdyenEnvironment()) {
      case constants.MODE.TEST:
        returnValue = constants.ADYEN_TEST_URL;
        break;

      case constants.MODE.LIVE:
        returnValue = constants.ADYEN_LIVE_URL;
        break;
    }

    return returnValue;
  },
  getAdyenGivingConfig: function getAdyenGivingConfig(order) {
    var paymentMethod = order.custom.Adyen_paymentMethod;

    if (!AdyenConfigs.getAdyenGivingEnabled() || !adyenHelperObj.isAdyenGivingAvailable(paymentMethod)) {
      return null;
    }

    var givingConfigs = {};
    var configuredAmounts = adyenHelperObj.getDonationAmounts();
    givingConfigs.adyenGivingAvailable = true;
    givingConfigs.configuredAmounts = configuredAmounts;
    givingConfigs.charityName = AdyenConfigs.getAdyenGivingCharityName();
    givingConfigs.charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
    givingConfigs.charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
    givingConfigs.adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
    givingConfigs.adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();
    givingConfigs.donationAmounts = JSON.stringify({
      currency: session.currency.currencyCode,
      values: configuredAmounts
    });
    givingConfigs.pspReference = order.custom.Adyen_pspReference;

    for (var config in givingConfigs) {
      if (Object.prototype.hasOwnProperty.call(givingConfigs, config)) {
        if (givingConfigs[config] === null) {
          Logger.getLogger('Adyen').error('Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly');
          return null;
        }
      }
    }

    return givingConfigs;
  },
  // get the URL for the checkout component based on the current Adyen component version
  getCheckoutUrl: function getCheckoutUrl() {
    var checkoutUrl = this.getLoadingContext();
    return "".concat(checkoutUrl, "sdk/").concat(constants.CHECKOUT_COMPONENT_VERSION, "/adyen.js");
  },
  // get the URL for the checkout component css based on the current Adyen component version
  getCheckoutCSS: function getCheckoutCSS() {
    var checkoutCSS = this.getLoadingContext();
    return "".concat(checkoutCSS, "sdk/").concat(constants.CHECKOUT_COMPONENT_VERSION, "/adyen.css");
  },
  // get the loading context based on the current environment (live or test)
  getLoadingContext: function getLoadingContext() {
    var returnValue = '';

    switch (AdyenConfigs.getAdyenEnvironment()) {
      case constants.MODE.TEST:
        returnValue = constants.LOADING_CONTEXT_TEST;
        break;

      case constants.MODE.LIVE:
        var frontEndRegion = AdyenConfigs.getAdyenFrontendRegion();

        if (frontEndRegion === constants.FRONTEND_REGIONS.US) {
          returnValue = constants.LOADING_CONTEXT_LIVE_US;
          break;
        }

        if (frontEndRegion === constants.FRONTEND_REGIONS.AU) {
          returnValue = constants.LOADING_CONTEXT_LIVE_AU;
          break;
        }

        returnValue = constants.LOADING_CONTEXT_LIVE_EU;
        break;
    }

    return returnValue;
  },
  // get the hash used to verify redirect requests
  getAdyenHash: function getAdyenHash(value, salt) {
    var data = value + salt;
    var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    var signature = Encoding.toHex(digestSHA512.digestBytes(new Bytes(data, 'UTF-8')));
    return signature;
  },
  // returns an array containing the donation amounts configured in the custom preferences for Adyen Giving
  getDonationAmounts: function getDonationAmounts() {
    var returnValue = [];
    var configuredValue = AdyenConfigs.getAdyenGivingDonationAmounts();

    if (!empty(configuredValue)) {
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
  // checks whether Adyen giving is available for the selected payment method
  isAdyenGivingAvailable: function isAdyenGivingAvailable(paymentMethod) {
    var availablePaymentMethods = ['visa', 'mc', 'amex', 'cup', 'jcb', 'diners', 'discover', 'cartebancaire', 'bcmc', 'ideal', 'giropay', 'directEbanking', 'vipps', 'sepadirectdebit', 'directdebit_GB'];
    return availablePaymentMethods.indexOf(paymentMethod) !== -1;
  },
  // gets the ID for ratePay using the custom preference and the encoded session ID
  getRatePayID: function getRatePayID() {
    var returnValue = {};
    var ratePayMerchantID = AdyenConfigs.getRatePayMerchantID();

    if (ratePayMerchantID) {
      returnValue.ratePayId = ratePayMerchantID;
    }

    if (!session.privacy.ratePayFingerprint || session.privacy.ratePayFingerprint === null) {
      var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
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
  // Get stored card token of customer saved card based on matched cardUUID
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
  // populates and returns the args paymentRequest with shopper information using the order contains in the args object itself
  createShopperObject: function createShopperObject(args) {
    var _args$order, _args$order$getDefaul, _args$order$getDefaul2;

    var gender = 'UNKNOWN';

    if (args.paymentRequest.shopperName && args.paymentRequest.shopperName.gender) {
      gender = args.paymentRequest.shopperName.gender;
    }

    if ((_args$order = args.order) !== null && _args$order !== void 0 && (_args$order$getDefaul = _args$order.getDefaultShipment()) !== null && _args$order$getDefaul !== void 0 && (_args$order$getDefaul2 = _args$order$getDefaul.getShippingAddress()) !== null && _args$order$getDefaul2 !== void 0 && _args$order$getDefaul2.getPhone()) {
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

    var address = args.order.getBillingAddress() || args.order.getDefaultShipment().getShippingAddress();
    var shopperDetails = {
      firstName: address === null || address === void 0 ? void 0 : address.firstName,
      gender: gender,
      infix: '',
      lastName: address === null || address === void 0 ? void 0 : address.lastName
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
  // populates the paymentRequest with address information using the order and payment method and returns it
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
  // creates a request object to send to the Adyen Checkout API
  createAdyenRequestObject: function createAdyenRequestObject(order, paymentInstrument) {
    var _stateData$paymentMet;

    var jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);
    var filteredJson = adyenHelperObj.validateStateData(jsonObject);
    var stateData = filteredJson.stateData;
    var reference = 'recurringPayment-account';
    var orderToken = 'recurringPayment-token';

    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
      orderToken = order.getOrderToken();
    }

    var signature = ''; //Create signature to verify returnUrl if there is an order

    if (order && order.getUUID()) {
      signature = adyenHelperObj.createSignature(paymentInstrument, order.getUUID(), reference);
    }

    if ((_stateData$paymentMet = stateData.paymentMethod) !== null && _stateData$paymentMet !== void 0 && _stateData$paymentMet.storedPaymentMethodId) {
      stateData.recurringProcessingModel = 'CardOnFile';
      stateData.shopperInteraction = 'ContAuth';
    } else {
      stateData.shopperInteraction = 'Ecommerce';
    }

    stateData.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https('Adyen-ShowConfirmation', 'merchantReference', reference, 'signature', signature, 'orderToken', orderToken).toString();
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo();
    stateData.additionalData = {};
    return stateData;
  },
  createSignature: function createSignature(paymentInstrument, value, salt) {
    var newSignature = adyenHelperObj.getAdyenHash(value, salt);
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = newSignature;
    });
    return newSignature;
  },
  // adds 3DS2 fields to an Adyen Checkout payments Request
  add3DS2Data: function add3DS2Data(jsonObject) {
    jsonObject.additionalData.allow3DS2 = true;
    jsonObject.channel = 'web';
    var origin = "".concat(request.getHttpProtocol(), "://").concat(request.getHttpHost());
    jsonObject.origin = origin;
    return jsonObject;
  },
  // gets the SFCC card type name based on the Adyen card type name
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

        case 'Carte Bancaire':
          cardType = 'cartebancaire';
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
  // gets the Adyen card type name based on the SFCC card type name
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

        case 'cartebancaire':
          cardType = 'Carte Bancaire';
          break;

        default:
          cardType = '';
          break;
      }

      return cardType;
    }

    throw new Error('cardType argument is not passed to getSFCCCardType function');
  },
  // saves the payment details in the paymentInstrument's custom object
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
  // converts the currency value for the Adyen Checkout API
  getCurrencyValueForApi: function getCurrencyValueForApi(amount) {
    var currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
    var digitsNumber = adyenHelperObj.getFractionDigits(currencyCode.toString());
    var value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties

    return new dw.value.Money(value, currencyCode);
  },
  // get the fraction digits based on the currency code used to convert amounts of currency for the Adyen Checkout API
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
  getApplicationInfo: function getApplicationInfo() {
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
      version: constants.VERSION
    };
    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
      integrator: AdyenConfigs.getSystemIntegratorName()
    };
    return applicationInfo;
  },
  // validates all fields in a state data object. Filters out all invalid fields
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
  },
  createAdyenCheckoutResponse: function createAdyenCheckoutResponse(checkoutresponse) {
    if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.REFUSED, constants.RESULTCODES.ERROR, constants.RESULTCODES.CANCELLED].indexOf(checkoutresponse.resultCode) !== -1) {
      return {
        isFinal: true,
        isSuccessful: checkoutresponse.resultCode === constants.RESULTCODES.AUTHORISED,
        merchantReference: checkoutresponse.merchantReference
      };
    }

    if ([constants.RESULTCODES.REDIRECTSHOPPER, constants.RESULTCODES.IDENTIFYSHOPPER, constants.RESULTCODES.CHALLENGESHOPPER, constants.RESULTCODES.PRESENTTOSHOPPER, constants.RESULTCODES.PENDING].indexOf(checkoutresponse.resultCode) !== -1) {
      return {
        isFinal: false,
        action: checkoutresponse.action || checkoutresponse.fullResponse.action
      };
    }

    if (checkoutresponse.resultCode === 'Received') {
      return {
        isFinal: false
      };
    }

    dwsystem.Logger.getLogger('Adyen').error("Unknown resultCode: ".concat(checkoutresponse.resultCode, "."));
    return {
      isFinal: true,
      isSuccessful: false
    };
  }
};
module.exports = adyenHelperObj;