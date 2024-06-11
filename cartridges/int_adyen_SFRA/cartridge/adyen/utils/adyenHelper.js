"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
var MessageDigest = require('dw/crypto/MessageDigest');
var Encoding = require('dw/crypto/Encoding');
var CustomerMgr = require('dw/customer/CustomerMgr');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMgr = require('dw/order/ShippingMgr');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var StringUtils = require('dw/util/StringUtils');
//script includes
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var BasketMgr = require('dw/order/BasketMgr');

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
      AdyenLogs.info_log("Successfully retrieve service with name ".concat(service));
    } catch (e) {
      AdyenLogs.error_log("Can't get service instance with name ".concat(service));
      // e.message
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
  getShippingCost: function getShippingCost(shippingMethod, shipment) {
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
    return {
      value: shippingCost.amount.value,
      currencyCode: shippingCost.amount.currencyCode
    };
  },
  getShippingMethods: function getShippingMethods(shipment, address) {
    if (!shipment) return null;
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingMethods;
    if (address) {
      shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
      shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }
    return shippingMethods;
  },
  getShipmentUUID: function getShipmentUUID(shipment) {
    if (!shipment) return null;
    return shipment.UUID;
  },
  getApplicableShippingMethods: function getApplicableShippingMethods(shipment, address) {
    var _this = this;
    var shippingMethods = this.getShippingMethods(shipment, address);
    if (!shippingMethods) {
      return null;
    }

    // Filter out whatever the method associated with in store pickup
    var filteredMethods = [];
    collections.forEach(shippingMethods, function (shippingMethod) {
      if (!shippingMethod.custom.storePickupEnabled) {
        var shippingMethodModel = new ShippingMethodModel(shippingMethod, shipment);
        var shippingCost = _this.getShippingCost(shippingMethod, shipment);
        var shipmentUUID = _this.getShipmentUUID(shipment);
        filteredMethods.push(_objectSpread(_objectSpread({}, shippingMethodModel), {}, {
          shippingCost: shippingCost,
          shipmentUUID: shipmentUUID
        }));
      }
    });
    return filteredMethods;
  },
  callGetShippingMethods: function callGetShippingMethods(shippingAddress) {
    var address;
    try {
      address = {
        city: shippingAddress.city,
        countryCode: shippingAddress.countryCode,
        stateCode: shippingAddress.stateOrRegion
      };
      var currentBasket = BasketMgr.getCurrentBasket();
      var currentShippingMethodsModels = this.getApplicableShippingMethods(currentBasket.getDefaultShipment(), address);
      return currentShippingMethodsModels;
    } catch (error) {
      AdyenLogs.error_log('Failed to fetch shipping methods');
      AdyenLogs.error_log(error);
    }
  },
  getAdyenGivingConfig: function getAdyenGivingConfig(order) {
    if (!order.getPaymentInstruments(adyenHelperObj.getOrderMainPaymentInstrumentType(order)).length) {
      return null;
    }
    var paymentInstrument = order.getPaymentInstruments(adyenHelperObj.getOrderMainPaymentInstrumentType(order))[0];
    if (!AdyenConfigs.getAdyenGivingEnabled() || !adyenHelperObj.isAdyenGivingAvailable(paymentInstrument)) {
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
    givingConfigs.pspReference = paymentInstrument.paymentTransaction.custom.Adyen_pspReference;
    for (var config in givingConfigs) {
      if (Object.prototype.hasOwnProperty.call(givingConfigs, config)) {
        if (givingConfigs[config] === null) {
          AdyenLogs.error_log('Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly');
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
  // converts to a syntax-safe HTML string
  encodeHtml: function encodeHtml(str) {
    return StringUtils.encodeString(str, 0);
  },
  // get the current region-based checkout environment
  getCheckoutEnvironment: function getCheckoutEnvironment() {
    var returnValue = '';
    switch (AdyenConfigs.getAdyenEnvironment()) {
      case constants.MODE.TEST:
        returnValue = constants.CHECKOUT_ENVIRONMENT_TEST;
        break;
      case constants.MODE.LIVE:
        var frontEndRegion = AdyenConfigs.getAdyenFrontendRegion();
        if (frontEndRegion === constants.FRONTEND_REGIONS.US) {
          returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_US;
          break;
        }
        if (frontEndRegion === constants.FRONTEND_REGIONS.AU) {
          returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_AU;
          break;
        }
        if (frontEndRegion === constants.FRONTEND_REGIONS.IN) {
          returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_IN;
          break;
        }
        returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_EU;
        break;
    }
    return returnValue;
  },
  // get the loading context based on the current environment (live or test)
  getLoadingContext: function getLoadingContext() {
    return "https://checkoutshopper-".concat(adyenHelperObj.getCheckoutEnvironment(), ".adyen.com/checkoutshopper/");
  },
  // get the hash used to verify redirect requests
  getAdyenHash: function getAdyenHash(value, salt) {
    var data = value + salt;
    var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    var signature = Encoding.toHex(digestSHA512.digestBytes(new Bytes(data, 'UTF-8')));
    return signature;
  },
  getBasketAmount: function getBasketAmount() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      return;
    }
    var amount = {
      currency: currentBasket.currencyCode,
      value: this.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    return JSON.stringify(amount);
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
  // determines whether Adyen Giving is available based on the donation token 
  isAdyenGivingAvailable: function isAdyenGivingAvailable(paymentInstrument) {
    // Adyen giving is only available for BCMC in POS
    return paymentInstrument.paymentTransaction.custom.Adyen_donationToken && paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod !== 'bcmc';
  },
  // gets the ID for ratePay using the custom preference and the encoded session ID
  getRatePayID: function getRatePayID() {
    var returnValue = {};
    var ratePayMerchantID = AdyenConfigs.getRatePayMerchantID();
    if (ratePayMerchantID) {
      returnValue.ratePayID = ratePayMerchantID;
    }
    var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    returnValue.sessionID = Encoding.toHex(digestSHA512.digestBytes(new Bytes(session.sessionID, 'UTF-8')));
    session.privacy.ratePayFingerprint = returnValue.sessionID;
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
        creditCardInstrument = instrumentsIter.next();
        // find token ID exists for matching payment card
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
    var signature = '';
    //Create signature to verify returnUrl if there is an order
    if (order && order.getUUID()) {
      signature = adyenHelperObj.createSignature(paymentInstrument, order.getUUID(), reference);
    }

    // Add recurringProcessingModel in case shopper wants to save the card from checkout
    if (stateData.storePaymentMethod) {
      stateData.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
    }
    if ((_stateData$paymentMet = stateData.paymentMethod) !== null && _stateData$paymentMet !== void 0 && _stateData$paymentMet.storedPaymentMethodId) {
      stateData.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
      stateData.shopperInteraction = constants.SHOPPER_INTERACTIONS.CONT_AUTH;
    } else {
      stateData.shopperInteraction = constants.SHOPPER_INTERACTIONS.ECOMMERCE;
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
    jsonObject.authenticationData = {
      threeDSRequestData: {
        nativeThreeDS: 'preferred'
      }
    };
    jsonObject.channel = 'web';
    var origin = "".concat(request.getHttpProtocol(), "://").concat(request.getHttpHost());
    jsonObject.origin = origin;
    return jsonObject;
  },
  getAdyenComponentType: function getAdyenComponentType(paymentMethod) {
    var methodName;
    switch (paymentMethod) {
      case 'applepay':
        methodName = 'Apple Pay';
        break;
      case 'amazonpay':
        methodName = 'Amazon Pay';
        break;
      default:
        methodName = paymentMethod;
    }
    return methodName;
  },
  getOrderMainPaymentInstrumentType: function getOrderMainPaymentInstrumentType(order) {
    var type = constants.METHOD_ADYEN_COMPONENT;
    collections.forEach(order.getPaymentInstruments(), function (item) {
      var _item$custom$adyenMai;
      if ((_item$custom$adyenMai = item.custom.adyenMainPaymentInstrument) !== null && _item$custom$adyenMai !== void 0 && _item$custom$adyenMai.value) {
        var _item$custom$adyenMai2;
        type = (_item$custom$adyenMai2 = item.custom.adyenMainPaymentInstrument) === null || _item$custom$adyenMai2 === void 0 ? void 0 : _item$custom$adyenMai2.value;
      }
    });
    return type;
  },
  getPaymentInstrumentType: function getPaymentInstrumentType(isCreditCard) {
    return isCreditCard ? PaymentInstrument.METHOD_CREDIT_CARD : constants.METHOD_ADYEN_COMPONENT;
  },
  // gets the Adyen card type name based on the SFCC card type name
  getSfccCardType: function getSfccCardType(cardType) {
    if (!empty(cardType)) {
      switch (cardType) {
        case 'visa':
        case 'visa_applepay':
          cardType = 'Visa';
          break;
        case 'mc':
        case 'mc_applepay':
          cardType = 'Mastercard';
          break;
        case 'amex':
        case 'amex_applepay':
          cardType = 'Amex';
          break;
        case 'discover':
        case 'discover_applepay':
          cardType = 'Discover';
          break;
        case 'maestro':
        case 'maestrouk':
        case 'maestro_applepay':
          cardType = 'Maestro';
          break;
        case 'diners':
        case 'diners_applepay':
          cardType = 'Diners';
          break;
        case 'bcmc':
          cardType = 'Bancontact';
          break;
        case 'jcb':
        case 'jcb_applepay':
          cardType = 'JCB';
          break;
        case 'cup':
          cardType = 'CUP';
          break;
        case 'cartebancaire':
        case 'cartebancaire_applepay':
          cardType = 'Carte Bancaire';
          break;
        default:
          cardType = '';
          break;
      }
      return cardType;
    }
    throw new Error('cardType argument is not passed to getSfccCardType function');
  },
  // saves the payment details in the paymentInstrument's custom object
  savePaymentDetails: function savePaymentDetails(paymentInstrument, order, result) {
    var _result$additionalDat, _result$fullResponse;
    paymentInstrument.paymentTransaction.transactionID = result.pspReference;
    paymentInstrument.paymentTransaction.custom.Adyen_pspReference = result.pspReference;
    if ((_result$additionalDat = result.additionalData) !== null && _result$additionalDat !== void 0 && _result$additionalDat.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = result.additionalData.paymentMethod;
    } else if (result.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = JSON.stringify(result.paymentMethod.type);
    }

    // For authenticated shoppers we are setting the token on other place already
    // SFRA throws an error if you try to set token again that's why this check is added
    var tokenAlreadyExists = paymentInstrument.getCreditCardToken();
    if (!tokenAlreadyExists && result.additionalData && result.additionalData['recurring.recurringDetailReference']) {
      paymentInstrument.setCreditCardToken(result.additionalData['recurring.recurringDetailReference']);
    }
    paymentInstrument.paymentTransaction.custom.authCode = result.resultCode ? result.resultCode : '';
    order.custom.Adyen_value = '0';
    if (result.donationToken || (_result$fullResponse = result.fullResponse) !== null && _result$fullResponse !== void 0 && _result$fullResponse.donationToken) {
      paymentInstrument.paymentTransaction.custom.Adyen_donationToken = result.donationToken || result.fullResponse.donationToken;
    }
    // Save full response to transaction custom attribute
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(result);
    return true;
  },
  getFirstTwoNumbersFromYear: function getFirstTwoNumbersFromYear() {
    return Math.floor(new Date().getFullYear() / 100);
  },
  // converts the currency value for the Adyen Checkout API
  getCurrencyValueForApi: function getCurrencyValueForApi(amount) {
    var currencyCode = dwutil.Currency.getCurrency(amount.currencyCode) || session.currency.currencyCode;
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
  getDivisorForCurrency: function getDivisorForCurrency(amount) {
    var fractionDigits = adyenHelperObj.getFractionDigits(amount.currencyCode);
    return Math.pow(10, fractionDigits);
  },
  getApplicationInfo: function getApplicationInfo() {
    var applicationInfo = {};
    applicationInfo.merchantApplication = {
      name: constants.MERCHANT_APPLICATION_NAME,
      version: constants.VERSION
    };
    applicationInfo.externalPlatform = {
      name: constants.EXTERNAL_PLATFORM_NAME,
      version: constants.EXTERNAL_PLATFORM_VERSION,
      integrator: AdyenConfigs.getSystemIntegratorName()
    };
    return applicationInfo;
  },
  isApplePay: function isApplePay(paymentMethod) {
    return paymentMethod === constants.PAYMENTMETHODS.APPLEPAY;
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
    if (checkoutresponse.resultCode === constants.RESULTCODES.RECEIVED) {
      return {
        isFinal: false
      };
    }
    AdyenLogs.error_log("Unknown resultCode: ".concat(checkoutresponse.resultCode, "."));
    return {
      isFinal: true,
      isSuccessful: false
    };
  },
  getPaymentMethodType: function getPaymentMethodType(paymentMethod) {
    return paymentMethod.type === constants.ACTIONTYPES.GIFTCARD ? paymentMethod.brand : paymentMethod.type;
  },
  //SALE payment methods require payment transaction type to be Capture
  setPaymentTransactionType: function setPaymentTransactionType(paymentInstrument, paymentMethod) {
    var salePaymentMethods = AdyenConfigs.getAdyenSalePaymentMethods();
    var paymentMethodType = this.getPaymentMethodType(paymentMethod);
    if (salePaymentMethods.indexOf(paymentMethodType) > -1) {
      Transaction.wrap(function () {
        paymentInstrument.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
      });
    }
  },
  executeCall: function executeCall(serviceType, requestObject) {
    var service = this.getService(serviceType);
    if (service === null) {
      throw new Error("Could not create ".concat(serviceType, " service object"));
    }
    if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE) {
      var livePrefix = AdyenConfigs.getLivePrefix();
      var serviceUrl = service.getURL().replace("[YOUR_LIVE_PREFIX]", livePrefix);
      service.setURL(serviceUrl);
    }
    var maxRetries = constants.MAX_API_RETRIES;
    var apiKey = AdyenConfigs.getAdyenApiKey();
    var uuid = UUIDUtils.createUUID();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-KEY', apiKey);
    service.addHeader('Idempotency-Key', uuid);
    var callResult;
    // retry the call until we reach max retries OR the callresult is OK
    for (var nrRetries = 0; nrRetries < maxRetries && !((_callResult = callResult) !== null && _callResult !== void 0 && _callResult.isOk()); nrRetries++) {
      var _callResult;
      callResult = service.call(JSON.stringify(requestObject));
    }
    if (!callResult.isOk()) {
      throw new Error("".concat(serviceType, " service call error code").concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }
    var resultObject = callResult.object;
    if (!resultObject || !resultObject.getText()) {
      throw new Error("No correct response from ".concat(serviceType, " service call"));
    }
    return JSON.parse(resultObject.getText());
  }
};
module.exports = adyenHelperObj;