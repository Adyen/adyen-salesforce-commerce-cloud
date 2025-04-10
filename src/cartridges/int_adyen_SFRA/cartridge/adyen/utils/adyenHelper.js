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
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Currency = require('dw/util/Currency');
const URLUtils = require('dw/web/URLUtils');
const Bytes = require('dw/util/Bytes');
const MessageDigest = require('dw/crypto/MessageDigest');
const Encoding = require('dw/crypto/Encoding');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Transaction = require('dw/system/Transaction');
const UUIDUtils = require('dw/util/UUIDUtils');
const ShippingMgr = require('dw/order/ShippingMgr');
const PaymentInstrument = require('dw/order/PaymentInstrument');
const StringUtils = require('dw/util/StringUtils');
const Money = require('dw/value/Money');
const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
//script includes
const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/* eslint no-var: off */
let adyenHelperObj = {
  // Create the service config used to make calls to the Adyen Checkout API (used for all services)
  getService(service, reqMethod = 'POST') {
    let adyenService = null;

    try {
      adyenService = LocalServiceRegistry.createService(service, {
        createRequest(svc, args) {
          svc.setRequestMethod(reqMethod);
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
    } catch (error) {
      AdyenLogs.error_log(`Can't get service instance with name ${service}`, error);
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

  /**
   * Returns shippingCost including taxes for a specific Shipment / ShippingMethod pair including the product level shipping cost if any
   * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
   * @param {dw.order.Shipment} shipment - a shipment of the current basket
   * @returns {{currencyCode: String, value: String}} - Shipping Cost including taxes
   */
  getShippingCost(shippingMethod, shipment) {
    const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    let shippingCost = shipmentShippingModel.getShippingCost(shippingMethod).getAmount();
    collections.forEach(shipment.getProductLineItems(), (lineItem) => {
      const product = lineItem.getProduct();
      const productQuantity = lineItem.getQuantity();
      const productShippingModel = ShippingMgr.getProductShippingModel(product);
      let productShippingCost = productShippingModel.getShippingCost(shippingMethod)
        ? productShippingModel.getShippingCost(shippingMethod).getAmount().multiply(productQuantity)
        : new Money(0, product.getPriceModel().getPrice().getCurrencyCode());
      shippingCost = shippingCost.add(productShippingCost);
    })
    return {
      value: shippingCost.getValue(),
      currencyCode: shippingCost.getCurrencyCode(),
    };
  },

  /**
   * Returns applicable shipping methods for specific Shipment / ShippingAddress pair.
   * @param {dw.order.OrderAddress} address - the shipping address of the default shipment of the current basket
   * @param {dw.order.Shipment} shipment - a shipment of the current basket
   * @returns {dw.util.ArrayList<dw.order.ShippingMethod> | null} - list of applicable shipping methods or null
   */
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

  /**
   * Returns shipment UUID for the shipment.
   * @param {dw.order.Shipment} shipment - a shipment of the current basket
   * @returns {String | null} - shipment UUID or null
   */
  getShipmentUUID(shipment) {
    if (!shipment) return null;
    return shipment.UUID;
  },

  /**
   * @typedef {object} ApplicableShippingMethodModel
   * @property {string|null} ID
   * @property {string|null} displayName
   * @property {string|null} estimatedArrivalTime
   * @property {boolean|null} default
   * @property {boolean|null} [selected]
   * @property {{currencyCode: String, value: String}} shippingCost
   * @property {string|null} shipmentUUID
   */

  /**
   * Returns applicable shipping methods(excluding store pickup methods) for specific Shipment / ShippingAddress pair.
   * @param {dw.order.OrderAddress} address - the shipping address of the default shipment of the current basket
   * @param {dw.order.Shipment} shipment - a shipment of the current basket
   * @returns {dw.util.ArrayList<ApplicableShippingMethodModel> | null} - list of applicable shipping methods or null
   */
  getApplicableShippingMethods(shipment, address) {
    const shippingMethods = adyenHelperObj.getShippingMethods(shipment, address);
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
        const shippingCost = adyenHelperObj.getShippingCost(shippingMethod, shipment);
        const shipmentUUID = adyenHelperObj.getShipmentUUID(shipment);
        filteredMethods.push({
          ...shippingMethodModel,
          shippingCost,
          shipmentUUID,
        });
      }
    });

    return filteredMethods;
  },

  getAdyenGivingConfig(order) {
    if (!order.getPaymentInstruments(
      adyenHelperObj.getOrderMainPaymentInstrumentType(order),
    ).length){
      return null;
    }
    const paymentInstrument = order.getPaymentInstruments(
      adyenHelperObj.getOrderMainPaymentInstrumentType(order),
    )[0];
    if (
      !AdyenConfigs.getAdyenGivingEnabled() ||
      !adyenHelperObj.isAdyenGivingAvailable(paymentInstrument)
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

  // converts to a syntax-safe HTML string
  encodeHtml(str) {
    return StringUtils.encodeString(str, 0);
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
        if (frontEndRegion === constants.FRONTEND_REGIONS.APSE) {
          returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_APSE;
          break;
        }
        returnValue = constants.CHECKOUT_ENVIRONMENT_LIVE_EU;
        break;
    }
    return returnValue;
  },

  getTerminalApiEnvironment() {
    let returnValue = '';
    switch (AdyenConfigs.getAdyenEnvironment()) {
      case constants.MODE.TEST:
        returnValue = constants.POS_ENVIRONMENT_TEST;
        break;
      case constants.MODE.LIVE:
        const terminalRegion = AdyenConfigs.getAdyenPosRegion();
        if (terminalRegion === constants.POS_REGIONS.US) {
          returnValue = constants.POS_ENVIRONMENT_LIVE_US;
          break;
        }
        if (terminalRegion === constants.POS_REGIONS.AU) {
          returnValue = constants.POS_ENVIRONMENT_LIVE_AU;
          break;
        }
        if (terminalRegion === constants.POS_REGIONS.APSE) {
          returnValue = constants.POS_ENVIRONMENT_LIVE_APSE;
          break;
        }
        returnValue = constants.POS_ENVIRONMENT_LIVE_EU;
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

  getCustomerEmail() {
    const currentBasket = BasketMgr.getCurrentBasket();
    return currentBasket ? currentBasket.customerEmail : '';
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

  // determines whether Adyen Giving is available based on the donation token
  isAdyenGivingAvailable(paymentInstrument) {
    return paymentInstrument.paymentTransaction.custom.Adyen_donationToken;
  },

  // gets the ID for ratePay using the custom preference and the encoded session ID
  getRatePayID: function getRatePayID() {
    let returnValue = {};
    const ratePayMerchantID = AdyenConfigs.getRatePayMerchantID();
    if (ratePayMerchantID) {
      returnValue.ratePayID = ratePayMerchantID;
    }

    let digestSHA512 = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    returnValue.sessionID = Encoding.toHex(
      digestSHA512.digestBytes(new Bytes(session.sessionID, 'UTF-8')),
    );
    session.privacy.ratePayFingerprint = returnValue.sessionID;
    return returnValue;
  },

  isOpenInvoiceMethod(paymentMethod) {
    return constants.OPEN_INVOICE_METHODS.some(method => paymentMethod.indexOf(method) > -1);
  },

  isMolpayMethod(paymentMethod) {
    if (paymentMethod.indexOf('molpay') > -1) {
      return true;
    }

    return false;
  },

  isPayPalExpress(paymentMethod){
	if (paymentMethod.type === 'paypal' && paymentMethod.subtype === 'express'){
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

    if (request.getLocale()) {
      args.paymentRequest.shopperLocale = request.getLocale();
    }

    args.paymentRequest.shopperIP = request.getHttpRemoteAddress();

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
  createAdyenRequestObject(orderNo, orderToken, paymentInstrument, customerEmail) {
    const jsonObject = JSON.parse(paymentInstrument.custom.adyenPaymentData);

    const filteredJson = adyenHelperObj.validateStateData(jsonObject);
    const { stateData } = filteredJson;

    // Add recurringProcessingModel in case shopper wants to save the card from checkout
    if (stateData.storePaymentMethod){
      stateData.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
    }

    if (stateData.paymentMethod?.storedPaymentMethodId) {
      stateData.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
      stateData.shopperInteraction = constants.SHOPPER_INTERACTIONS.CONT_AUTH;
      if (customerEmail) {
        stateData.shopperEmail = customerEmail;
      }
    } else {
      stateData.shopperInteraction = constants.SHOPPER_INTERACTIONS.ECOMMERCE;
    }

    stateData.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
    stateData.reference = orderNo;
    stateData.returnUrl = adyenHelperObj.createRedirectUrl(paymentInstrument, orderNo, orderToken)
    stateData.applicationInfo = adyenHelperObj.getApplicationInfo();

    stateData.additionalData = {};
    return stateData;
  },

  /**
   * Returns unique hashed signature.
   * @param {dw.order.OrderPaymentInstrument} paymentInstrument - paymentInstrument for the current order or current basket.
   * @param {String} value - UUID to be hashed for creating signature.
   * @param {String} salt - order number for the current order or from createOrderNo() used as Salt for hash.
   * @returns {String} - returns hashed signature.
   */
  createSignature(paymentInstrument, value, salt) {
    const newSignature = adyenHelperObj.getAdyenHash(value, salt);
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = newSignature;
    });
    return newSignature;
  },

  /**
   * Returns redirectURL with 'Adyen-ShowConfirmation' route and query params .
   * @param {dw.order.OrderPaymentInstrument} paymentInstrument - paymentInstrument for the current order or current basket
   * @param {String} orderNo - order number for the current order or from createOrderNo()
   * @param {String} [orderToken] - orderToken for current order if order exists
   * @returns {String<dw.web.URL>} - returns String representation of the redirectURL
   */
  createRedirectUrl(paymentInstrument, orderNo, orderToken) {
    if(!(paymentInstrument instanceof dw.order.OrderPaymentInstrument)) {
      return null
    }
    const signature = adyenHelperObj.createSignature(
      paymentInstrument,
      UUIDUtils.createUUID(),
      orderNo,
    );
    return URLUtils.https(
      'Adyen-ShowConfirmation',
      'merchantReference',
      orderNo,
      'signature',
      signature,
      'orderToken',
      orderToken,
    ).toString();
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
      case 'paypal':
        methodName = 'PayPal';
        break;
      case 'googlepay':
        methodName = 'Google Pay';
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
    const cardTypeMapping = require('*/cartridge/adyen/config/card-type-mapping.json');
    if (empty(cardType)) {
        throw new Error('cardType argument is not passed to getSfccCardType function');
    }
    return cardTypeMapping[cardType] || '';
  },

  // saves the payment details in the paymentInstrument's custom object
  // set custom payment method field to sync with OMS
  savePaymentDetails(paymentInstrument, order, result) {
    paymentInstrument.paymentTransaction.transactionID = result.pspReference;
    paymentInstrument.paymentTransaction.custom.Adyen_pspReference =
      result.pspReference;

    if (result.additionalData?.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod =
        result.additionalData.paymentMethod;
      order.custom.Adyen_paymentMethod = result.additionalData.paymentMethod;
    } else if (result.paymentMethod) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = JSON.stringify(
        result.paymentMethod.type,
      );
      order.custom.Adyen_paymentMethod = JSON.stringify(
        result.paymentMethod.type,
      );
    }

    // For authenticated shoppers we are setting the token on other place already
    // SFRA throws an error if you try to set token again that's why this check is added
    const tokenAlreadyExists = paymentInstrument.getCreditCardToken();
    if (!tokenAlreadyExists && result.additionalData && result.additionalData['recurring.recurringDetailReference']) {
      paymentInstrument.setCreditCardToken(result.additionalData['recurring.recurringDetailReference']);
    }

    paymentInstrument.paymentTransaction.custom.authCode = result.resultCode
      ? result.resultCode
      : '';
    order.custom.Adyen_value = '0';
    if (result.donationToken || result.fullResponse?.donationToken){
      paymentInstrument.paymentTransaction.custom.Adyen_donationToken = result.donationToken || result.fullResponse.donationToken;
    }
    // Save full response to transaction custom attribute
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(
      result,
    );
    return true;
  },

  getFirstTwoNumbersFromYear() {
    return Math.floor(
      new Date().getFullYear() / 100,
    );
  },

  // converts the currency value for the Adyen Checkout API
  getCurrencyValueForApi(amount) {
    const currencyCode = Currency.getCurrency(amount.currencyCode) || session.currency.currencyCode;
    const digitsNumber = adyenHelperObj.getFractionDigits(
      currencyCode.toString(),
    );
    const value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties
    return new dw.value.Money(value, currencyCode);
  },

  // get the fraction digits based on the currency code used to convert amounts of currency for the Adyen Checkout API
  getFractionDigits(currencyCode) {
    let format;
    let currency = currencyCode || session.currency.currencyCode;
    switch (currency) {
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
    const applicationInfo = {};
    applicationInfo.merchantApplication = {
      name: constants.MERCHANT_APPLICATION_NAME,
      version: constants.VERSION,
    };

    applicationInfo.externalPlatform = {
      name: constants.EXTERNAL_PLATFORM_NAME,
      version: constants.EXTERNAL_PLATFORM_VERSION,
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

  getPaymentMethodType(paymentMethod){
    return paymentMethod.type === constants.ACTIONTYPES.GIFTCARD ? paymentMethod.brand : paymentMethod.type;
  },

//SALE payment methods require payment transaction type to be Capture
  setPaymentTransactionType(paymentInstrument, paymentMethod) {
    const salePaymentMethods = AdyenConfigs.getAdyenSalePaymentMethods();
    const paymentMethodType = this.getPaymentMethodType(paymentMethod);
    if (salePaymentMethods.indexOf(paymentMethodType) > -1) {
      Transaction.wrap(function () {
        paymentInstrument
          .getPaymentTransaction()
          .setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
      });
    }
  },

  isIntermediateResultCode(orderNo) {
    const order = OrderMgr.getOrder(orderNo);
    const paymentInstrument = order.getPaymentInstruments(
        adyenHelperObj.getOrderMainPaymentInstrumentType(order),
    )[0];
    const resultCode = paymentInstrument.paymentTransaction.custom.authCode;    
    return resultCode === constants.RESULTCODES.PENDING || resultCode === constants.RESULTCODES.RECEIVED;
},

  executeCall(serviceType, requestObject) {
    const service = this.getService(serviceType);
    if (service === null) {
      throw new Error(`Could not create ${serviceType} service object`);
    }

	const serviceApiVersion = service.getURL().replace(`[CHECKOUT_API_VERSION]`, constants.CHECKOUT_API_VERSION);
	service.setURL(serviceApiVersion);

    if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE) {
      const livePrefix = AdyenConfigs.getLivePrefix();
      const serviceUrl = service.getURL().replace(`[YOUR_LIVE_PREFIX]`, livePrefix);
      service.setURL(serviceUrl);
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
