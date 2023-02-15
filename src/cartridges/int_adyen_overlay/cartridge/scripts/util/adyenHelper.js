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
const dwsvc = require('dw/svc');
const dwsystem = require('dw/system');
const dwutil = require('dw/util');
const URLUtils = require('dw/web/URLUtils');
const Bytes = require('dw/util/Bytes');
const MessageDigest = require('dw/crypto/MessageDigest');
const Encoding = require('dw/crypto/Encoding');
const CustomerMgr = require('dw/customer/CustomerMgr');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const Transaction = require('dw/system/Transaction');
const UUIDUtils = require('dw/util/UUIDUtils');
const collections = require('*/cartridge/scripts/util/collections');
const ShippingMgr = require('dw/order/ShippingMgr');
const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
const PaymentInstrument = require('dw/order/PaymentInstrument');
//script includes
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const BasketMgr = require('dw/order/BasketMgr');

/* eslint no-var: off */
var adyenHelperObj = {
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
      AdyenLogs.info_log(`Successfully retrieve service with name ${service}`);
    } catch (e) {
      AdyenLogs.error_log(`Can't get service instance with name ${service}`);
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

  getShippingCost(shippingMethod, shipment) {
    const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    const shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
    return {
      value: shippingCost.amount.value,
      currencyCode: shippingCost.amount.currencyCode,
    };
  },

  getShippingMethods(shipment, address) {
    if (!shipment) return null;

    const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    let shippingMethods;
    if (address) {
      shippingMethods = shipmentShippingModel.getApplicableShippingMethods(
        address,
      );
    } else {
      shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    return shippingMethods;
  },

  getShipmentUUID(shipment) {
    if (!shipment) return null;
    return shipment.UUID;
  },

  getApplicableShippingMethods(shipment, address) {
    const shippingMethods = this.getShippingMethods(shipment, address);
    if (!shippingMethods) {
      return null;
    }

    // Filter out whatever the method associated with in store pickup
    const filteredMethods = [];
    collections.forEach(shippingMethods, (shippingMethod) => {
      if (!shippingMethod.custom.storePickupEnabled) {
        const shippingMethodModel = new ShippingMethodModel(
          shippingMethod,
          shipment,
        );
        const shippingCost = this.getShippingCost(shippingMethod, shipment);
        const shipmentUUID = this.getShipmentUUID(shipment);
        filteredMethods.push({
          ...shippingMethodModel,
          shippingCost,
          shipmentUUID,
        });
      }
    });

    return filteredMethods;
  },

  callGetShippingMethods(shippingAddress) {
    let address;
    try {
        address = {
          city: shippingAddress.city,
          countryCode: shippingAddress.countryCode,
          stateCode: shippingAddress.stateOrRegion,
        };
      const currentBasket = BasketMgr.getCurrentBasket();
      const currentShippingMethodsModels = this.getApplicableShippingMethods(
        currentBasket.getDefaultShipment(),
        address,
      );
      return currentShippingMethodsModels;
    } catch (error) {
      AdyenLogs.error_log('Failed to fetch shipping methods');
      AdyenLogs.error_log(error);
    }
  },

  getAdyenGivingConfig(order) {
    const paymentInstrument = order.getPaymentInstruments(
      adyenHelperObj.getOrderMainPaymentInstrumentType(order),
    )[0];
    const paymentMethod =
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod;
    if (
      !AdyenConfigs.getAdyenGivingEnabled() ||
      !adyenHelperObj.isAdyenGivingAvailable(paymentMethod)
    ) {
      return null;
    }
    const givingConfigs = {};
    const configuredAmounts = adyenHelperObj.getDonationAmounts();
    givingConfigs.adyenGivingAvailable = true;
    givingConfigs.configuredAmounts = configuredAmounts;
    givingConfigs.charityName = AdyenConfigs.getAdyenGivingCharityName();
    givingConfigs.charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
    givingConfigs.charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
    givingConfigs.adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
    givingConfigs.adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();

    givingConfigs.donationAmounts = JSON.stringify({
      currency: session.currency.currencyCode,
      values: configuredAmounts,
    });
    givingConfigs.pspReference =
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference;

    for (const config in givingConfigs) {
      if (Object.prototype.hasOwnProperty.call(givingConfigs, config)) {
        if (givingConfigs[config] === null) {
          AdyenLogs.error_log(
            'Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly',
          );
          return null;
        }
      }
    }
    return givingConfigs;
  },

  // get the URL for the checkout component based on the current Adyen component version
  getCheckoutUrl() {
    const checkoutUrl = this.getLoadingContext();
    return `${checkoutUrl}sdk/${constants.CHECKOUT_COMPONENT_VERSION}/adyen.js`;
  },

  // get the URL for the checkout component css based on the current Adyen component version
  getCheckoutCSS() {
    const checkoutCSS = this.getLoadingContext();
    return `${checkoutCSS}sdk/${constants.CHECKOUT_COMPONENT_VERSION}/adyen.css`;
  },

  // get the current region-based checkout environment
  getCheckoutEnvironment() {
    let returnValue = '';
    switch (AdyenConfigs.getAdyenEnvironment()) {
      case constants.MODE.TEST:
        returnValue = constants.CHECKOUT_ENVIRONMENT_TEST;
        break;
      case constants.MODE.LIVE:
        const frontEndRegion = AdyenConfigs.getAdyenFrontendRegion();
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
  getLoadingContext() {
    return `https://checkoutshopper-${adyenHelperObj.getCheckoutEnvironment()}.adyen.com/checkoutshopper/`;
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

  getBasketAmount() {
      const BasketMgr = require('dw/order/BasketMgr');
      const currentBasket = BasketMgr.getCurrentBasket();
      if(!currentBasket) {
        return;
      }
       const amount =  {
         currency: currentBasket.currencyCode,
         value: this.getCurrencyValueForApi(
           currentBasket.getTotalGrossPrice(),
         ).value,
       };
      return JSON.stringify(amount);
  },

  // returns an array containing the donation amounts configured in the custom preferences for Adyen Giving
  getDonationAmounts() {
    let returnValue = [];
    const configuredValue = AdyenConfigs.getAdyenGivingDonationAmounts();
    if (!empty(configuredValue)) {
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
    const ratePayMerchantID = AdyenConfigs.getRatePayMerchantID();
    if (ratePayMerchantID) {
      returnValue.ratePayID = ratePayMerchantID;
    }

    var digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    returnValue.sessionID = Encoding.toHex(
      digestSHA512.digestBytes(new Bytes(session.sessionID, 'UTF-8')),
    );
    session.privacy.ratePayFingerprint = returnValue.sessionID;
    return returnValue;
  },

  isOpenInvoiceMethod(paymentMethod) {
    if (
      paymentMethod.indexOf('afterpay') - 1 ||
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

    if (args.order?.getDefaultShipment()?.getShippingAddress()?.getPhone()) {
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

    const address =
      args.order.getBillingAddress() ||
      args.order.getDefaultShipment().getShippingAddress();
    const shopperDetails = {
      firstName: address?.firstName,
      gender,
      infix: '',
      lastName: address?.lastName,
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
    let orderToken = 'recurringPayment-token';
    if (order && order.getOrderNo()) {
      reference = order.getOrderNo();
      orderToken = order.getOrderToken();
    }

    let signature = '';
    //Create signature to verify returnUrl if there is an order
    if (order && order.getUUID()) {
      signature = adyenHelperObj.createSignature(
        paymentInstrument,
        order.getUUID(),
        reference,
      );
    }

    if (stateData.paymentMethod?.storedPaymentMethodId) {
      stateData.recurringProcessingModel = 'CardOnFile';
      stateData.shopperInteraction = 'ContAuth';
    } else {
      stateData.shopperInteraction = 'Ecommerce';
    }

    stateData.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
    stateData.reference = reference;
    stateData.returnUrl = URLUtils.https(
      'Adyen-ShowConfirmation',
      'merchantReference',
      reference,
      'signature',
      signature,
      'orderToken',
      orderToken,
    ).toString();
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo();

    stateData.additionalData = {};
    return stateData;
  },

  createSignature(paymentInstrument, value, salt) {
    const newSignature = adyenHelperObj.getAdyenHash(value, salt);
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = newSignature;
    });
    return newSignature;
  },

  // adds 3DS2 fields to an Adyen Checkout payments Request
  add3DS2Data(jsonObject) {
    jsonObject.authenticationData = {
      threeDSRequestData: {
        nativeThreeDS: 'preferred',
      },
    };
    jsonObject.channel = 'web';

    const origin = `${request.getHttpProtocol()}://${request.getHttpHost()}`;
    jsonObject.origin = origin;

    return jsonObject;
  },

  getAdyenComponentType(paymentMethod) {
    let methodName;
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

  getOrderMainPaymentInstrumentType(order) {
    let type = constants.METHOD_ADYEN_COMPONENT;
    collections.forEach(order.getPaymentInstruments(), (item) => {
      if (item.custom.adyenMainPaymentInstrument?.value) {
        type = item.custom.adyenMainPaymentInstrument?.value;
      }
    });
    return type;
  },

  getPaymentInstrumentType(isCreditCard) {
    return isCreditCard
      ? PaymentInstrument.METHOD_CREDIT_CARD
      : constants.METHOD_ADYEN_COMPONENT;
  },

  // gets the Adyen card type name based on the SFCC card type name
  getSfccCardType(cardType) {
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
    throw new Error(
      'cardType argument is not passed to getSfccCardType function',
    );
  },

  // saves the payment details in the paymentInstrument's custom object
  savePaymentDetails(paymentInstrument, order, result) {
    paymentInstrument.paymentTransaction.transactionID = session.privacy
      .giftCardResponse
      ? JSON.parse(session.privacy.giftCardResponse).orderPSPReference
      : result.pspReference;
    paymentInstrument.paymentTransaction.custom.Adyen_pspReference =
      result.pspReference;

    if (result.additionalData?.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod =
        result.additionalData.paymentMethod;
    } else if (result.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = JSON.stringify(
        result.paymentMethod,
      );
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

  getDivisorForCurrency(amount) {
    let fractionDigits = adyenHelperObj.getFractionDigits(amount.currencyCode);
    return Math.pow(10, fractionDigits);
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
      version: constants.VERSION,
    };

    applicationInfo.externalPlatform = {
      name: 'SalesforceCommerceCloud',
      version: externalPlatformVersion,
      integrator: AdyenConfigs.getSystemIntegratorName(),
    };

    return applicationInfo;
  },

    isApplePay(paymentMethod) {
      return paymentMethod === constants.PAYMENTMETHODS.APPLEPAY;
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
      [
        constants.RESULTCODES.AUTHORISED,
        constants.RESULTCODES.REFUSED,
        constants.RESULTCODES.ERROR,
        constants.RESULTCODES.CANCELLED,
      ].indexOf(checkoutresponse.resultCode) !== -1
    ) {
      return {
        isFinal: true,
        isSuccessful:
          checkoutresponse.resultCode === constants.RESULTCODES.AUTHORISED,
        merchantReference: checkoutresponse.merchantReference,
      };
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

    if (checkoutresponse.resultCode === constants.RESULTCODES.RECEIVED) {
      return {
        isFinal: false,
      };
    }

    AdyenLogs.error_log(`Unknown resultCode: ${checkoutresponse.resultCode}.`);
    return {
      isFinal: true,
      isSuccessful: false,
    };
  },

  executeCall(serviceType, requestObject) {
    const service = this.getService(serviceType);
    if (service === null) {
      throw new Error(`Could not create ${serviceType} service object`);
    }
    const maxRetries = constants.MAX_API_RETRIES;
    const apiKey = AdyenConfigs.getAdyenApiKey();
    const uuid = UUIDUtils.createUUID();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-KEY', apiKey);
    service.addHeader('Idempotency-Key', uuid);

    let callResult;
    // retry the call until we reach max retries OR the callresult is OK
    for (
      let nrRetries = 0;
      nrRetries < maxRetries && !callResult?.isOk();
      nrRetries++
    ) {
      callResult = service.call(JSON.stringify(requestObject));
    }

    if (!callResult.isOk()) {
      throw new Error(
        `${serviceType} service call error code${callResult
          .getError()
          .toString()} Error => ResponseStatus: ${callResult.getStatus()} | ResponseErrorText: ${callResult.getErrorMessage()} | ResponseText: ${callResult.getMsg()}`,
      );
    }

    const resultObject = callResult.object;
    if (!resultObject || !resultObject.getText()) {
      throw new Error(`No correct response from ${serviceType} service call`);
    }

    return JSON.parse(resultObject.getText());
  },
};

module.exports = adyenHelperObj;
