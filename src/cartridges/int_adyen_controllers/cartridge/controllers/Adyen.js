const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');
const PaymentMgr = require('dw/order/PaymentMgr');

/* Script Modules */
const app = require('app_storefront_controllers/cartridge/scripts/app');
const guard = require('app_storefront_controllers/cartridge/scripts/guard');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenSessions = require('*/cartridge/scripts/adyenSessions');

const constants = require('*/cartridge/adyenConstants/constants');
const paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

const EXTERNAL_PLATFORM_VERSION = 'SiteGenesis';
/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify() {
  const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');

  const status = checkAuth.check(request);
  if (!status) {
    app.getView().render('adyen/error');
    return {};
  }

  const handleNotify = require('*/cartridge/scripts/handleNotify');

  Transaction.begin();
  const notificationResult = handleNotify.notifyHttpParameterMap(
    request.httpParameterMap,
  );

  if (notificationResult.success) {
    Transaction.commit();
    app.getView().render('notify');
  } else {
    app
      .getView({
        errorMessage: notificationResult.errorMessage,
      })
      .render('/notifyError');
    Transaction.rollback();
  }
}

/**
 * Performs a zero auth transaction to add a card to an account
 */
function zeroAuth() {
  const adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
  const wallet = customer.getProfile().getWallet();
  const stateDataStr = request.httpParameterMap.getRequestBodyAsString();
  let paymentInstrument;
  Transaction.wrap(() => {
    paymentInstrument = wallet.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
    );
    paymentInstrument.custom.adyenPaymentData = stateDataStr;
  });

  Transaction.begin();
  const zeroAuthResult = adyenZeroAuth.zeroAuthPayment(
      customer,
      paymentInstrument,
  );
  if (zeroAuthResult.error) {
      Transaction.rollback();
      return false;
  }
  Transaction.commit();
  const responseUtils = require('*/cartridge/scripts/util/Response');
  responseUtils.renderJSON({zeroAuthResult});
}

/**
 * Redirect to Adyen after 3DS1 Authentication When adding a card to an account
 */
function Redirect3DS1Response() {
  try {
    const redirectResult = request.httpParameterMap.get('redirectResult').stringValue;
    const jsonRequest = {
      details: {
        redirectResult: redirectResult,
      },
    };
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);
    if (result.resultCode === 'Authorised') {
      return response.redirect(URLUtils.https('PaymentInstruments-List'));
    } else {
     return response.redirect(
          URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'),
      );
    }

  } catch (e) {
    AdyenLogs.error_log(
        `Error during 3ds1 response verification: ${e.toString()} in ${
            e.fileName
        }:${e.lineNumber}`,
    );
    return response.redirect(URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'));
  }
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
  try {
    const redirectResult = request.httpParameterMap.get('redirectResult').stringValue;
    const payload = request.httpParameterMap.get('payload').stringValue;
    const signature = request.httpParameterMap.get('signature').stringValue;
    const merchantReference = request.httpParameterMap.get('merchantReference').stringValue;
    const orderToken = request.httpParameterMap.get('orderToken').stringValue;
    const authorized = request.httpParameterMap.get('authorized').stringValue;
    const error = request.httpParameterMap.get('error').stringValue;

    const order = OrderMgr.getOrder(merchantReference, orderToken);

    // if the payment is authorized, we can navigate to order confirm
    if(authorized === 'true') {
      clearForms();
      return app.getController('COSummary').ShowConfirmation(order);
    }

    //if there is an eror, we nagivate and display the erorr
    if(error === 'true') {
      const errorStatus = request.httpParameterMap.get('errorStatus').stringValue;

      return app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, errorStatus),
      });
    }

    const adyenPaymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];

    if (
        adyenPaymentInstrument.paymentTransaction.custom.Adyen_merchantSig ===
        signature
    ) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        AdyenLogs.error_log(
            `Could not call payment/details for failed order ${order.orderNo}`,
        );
        return response.redirect(URLUtils.httpHome());
      }
      const details = redirectResult
          ? { redirectResult}
          : { payload };

      const hasQuerystringDetails = !!(details.redirectResult || details.payload);
      // Saved response from Adyen-PaymentsDetails
      let detailsResult = JSON.parse(
          adyenPaymentInstrument.paymentTransaction.custom.Adyen_authResult,
      );

      if (hasQuerystringDetails) {
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        detailsResult = adyenCheckout.doPaymentsDetailsCall({details});
        clearAdyenData(adyenPaymentInstrument);
      }

      if (
          [
            constants.RESULTCODES.AUTHORISED,
            constants.RESULTCODES.PENDING,
            constants.RESULTCODES.RECEIVED,
          ].indexOf(detailsResult.resultCode) > -1
      ) {
        Transaction.wrap(() => {
          AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, detailsResult);
        });
        clearForms();
        return app.getController('COSummary').ShowConfirmation(order);
      }
      // fail order
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      AdyenLogs.error_log(
          `Payment failed, result: ${JSON.stringify(detailsResult)}`,
      );
    } else {
      // fail order
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      AdyenLogs.error_log(
          `Payment failed, reason: invalid signature`,
      );
    }

    // should be assingned by previous calls or not
    const errorStatus = new dw.system.Status(
      dw.system.Status.ERROR,
      'confirm.error.declined',
    );

    app.getController('COSummary').Start({
      PlaceOrderError: errorStatus,
    });
  } catch (e) {
    AdyenLogs.error_log(
      `Could not verify showConfirmation: ${
        e.message
      } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
  return {};
}

/**
 *  Confirm payment status after receiving redirectResult from Adyen
 */
function paymentsDetails() {
  try {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const requestBody = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

    const data = requestBody.data;
    const isAmazonpay = data.paymentMethod === 'amazonpay';
    data.paymentMethod = undefined;

    const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(
        data
    );

    const response = AdyenHelper.createAdyenCheckoutResponse(
        paymentsDetailsResponse,
    );

    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode,
      };
    }

    //check if payment is not zero auth for my account
    if(paymentsDetailsResponse.merchantReference !== 'recurringPayment-account') {
      const order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference, requestBody.orderToken);
      const paymentInstruments = order.getPaymentInstruments(
          constants.METHOD_ADYEN_COMPONENT,
      );
      const signature = AdyenHelper.createSignature(
          paymentInstruments[0],
          order.getUUID(),
          paymentsDetailsResponse.merchantReference,
      );
      Transaction.wrap(() => {
        paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(
            paymentsDetailsResponse,
        );
      });
      response.redirectUrl = URLUtils.url(
          'Adyen-ShowConfirmation',
          'merchantReference',
          response.merchantReference,
          'orderToken',
          requestBody.orderToken,
          'signature',
          signature,
      ).toString();
    }

    const responseUtils = require('*/cartridge/scripts/util/Response');
    responseUtils.renderJSON({response});
  } catch (e) {
    AdyenLogs.error_log(
        `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${
            e.lineNumber
        }`,
    );
    return response.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}

/**
 * Make a payment from inside a component (used by paypal)
 */
function paymentFromComponent() {
  if (
      request.httpParameterMap
          .getRequestBodyAsString()
          .indexOf('cancelTransaction') > -1
  ) {
    const merchantReference = JSON.parse(request.httpParameterMap.getRequestBodyAsString()).merchantReference;
    AdyenLogs.info_log(
        `Shopper cancelled paymentFromComponent transaction for order ${merchantReference}`,
    );
    return;
  } else {
    const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

    const currentBasket = BasketMgr.getCurrentBasket();
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    let paymentInstrument;
    let order;

    Transaction.wrap(() => {
      const result = adyenRemovePreviousPI.removePaymentInstruments(
          currentBasket,
      );
      if (result.error) {
        return result;
      }
      const stateDataStr = request.httpParameterMap.getRequestBodyAsString();

      paymentInstrument = currentBasket.createPaymentInstrument(
          constants.METHOD_ADYEN_COMPONENT,
          currentBasket.totalGrossPrice,
      );
      const {paymentProcessor} = PaymentMgr.getPaymentMethod(
          paymentInstrument.paymentMethod,
      );
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.adyenPaymentData = stateDataStr;
      try {
        paymentInstrument.custom.adyenPaymentMethod = JSON.parse(
            stateDataStr,
        ).paymentMethod.type;
      } catch (e) {
        // Error parsing paymentMethod
      }
    });
    order = OrderMgr.createOrder(currentBasket);

    Transaction.begin();
    const result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
    result.orderNo = order.orderNo;
    result.orderToken = order.getOrderToken();

    Transaction.commit();
    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    if (paymentInstrument.custom.adyenPaymentMethod === 'amazonpay' && result.adyenErrorMessage) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    }
    const responseUtils = require('*/cartridge/scripts/util/Response');
    responseUtils.renderJSON({result});
  }
}

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent() {
  const paymentInformation = app.getForm('adyPaydata');
  const orderNumber = paymentInformation.get('merchantReference').value();
  const orderToken = paymentInformation.get('orderToken').value();
  const result = paymentInformation.get('result').value();
  const order = OrderMgr.getOrder(orderNumber, orderToken);
  const paymentInstruments = order.getPaymentInstruments(
    constants.METHOD_ADYEN_COMPONENT,
  );
  let adyenPaymentInstrument;

  const instrumentsIter = paymentInstruments.iterator();
  while (instrumentsIter.hasNext()) {
    adyenPaymentInstrument = instrumentsIter.next();
  }

  const stateData = JSON.parse(
    paymentInformation.get('paymentFromComponentStateData').value(),
  );

  let amazonPayResult;

  const hasStateData = stateData && stateData.details && stateData.paymentData;

  if (!hasStateData) {
    if (result && JSON.stringify(result).indexOf('amazonpay') > -1) {
      amazonPayResult = JSON.parse(result);
    } else {
      // The billing step is fulfilled, but order will be failed
      app.getForm('billing').object.fulfilled.value = true;
      // fail order if no stateData available
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COBilling').Start();

      return {};
    }
  }
  const { details } = stateData;
  const { paymentData } = stateData;

  // redirect to payment/details
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  const requestObject = {
    details,
    paymentData,
  };

  const paymentProcessor = PaymentMgr.getPaymentMethod(
    adyenPaymentInstrument.getPaymentMethod(),
  ).getPaymentProcessor();

  Transaction.wrap(() => {
    adyenPaymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
  });
  
  let finalResult;

  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    finalResult = amazonPayResult || adyenCheckout.doPaymentsDetailsCall(requestObject);
  }
  if (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
    ].indexOf(finalResult?.resultCode) > -1
  ) {
    Transaction.wrap(() => {
      AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, finalResult);
    });
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
    return {};
  }
  // handles the refresh
  else if (
    [
      Order.ORDER_STATUS_CREATED, 
      Order.ORDER_STATUS_NEW,
      Order.ORDER_STATUS_OPEN,
    ].indexOf(order.status.value) > -1
  ) {
    clearForms();
    return app.getController('COSummary').ShowConfirmation(order);
  }
  // fail order
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  // should be assingned by previous calls or not
  const errorStatus = new dw.system.Status(
    dw.system.Status.ERROR,
    'confirm.error.declined',
  );

  app.getController('COSummary').Start({
    PlaceOrderError: errorStatus,
  });
  return {};
}

function getConnectedTerminals() {
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    return adyenTerminalApi.getTerminals().response;
  }
  return '{}';
}

function getCountryCode(currentBasket) {
  const Locale = require('dw/util/Locale');
  const countryCode = Locale.getLocale(request.getLocale()).country;
  const firstItem = currentBasket.getShipments()?.[0];
  if (firstItem?.shippingAddress) {
    return firstItem.shippingAddress.getCountryCode().value;
  }
  return countryCode;
}

/**
 * Make a request to Adyen to create a new session
 */
function sessions(customer) {
    try {
      const currentBasket = BasketMgr.getCurrentBasket();
      const countryCode = getCountryCode(currentBasket);
      const response = adyenSessions.createSession(
          currentBasket,
          AdyenHelper.getCustomer(customer),
          countryCode,
      );
      const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
      const connectedTerminals = getConnectedTerminals();

      const currency = currentBasket.getTotalGrossPrice().currencyCode;
      const paymentAmount = currentBasket.getTotalGrossPrice().isAvailable()
          ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
          : new dw.value.Money(1000, currency);

      const shippingForm = session.forms.singleshipping;
      const shippingAddress = {
        firstName:  shippingForm.shippingAddress.addressFields.firstName.value,
        lastName:  shippingForm.shippingAddress.addressFields.lastName.value,
        address1:  shippingForm.shippingAddress.addressFields.address1.value,
        city:  shippingForm.shippingAddress.addressFields.city.value,
        country:  shippingForm.shippingAddress.addressFields.country.value,
        phone:  shippingForm.shippingAddress.addressFields.phone.value,
        postalCode:  shippingForm.shippingAddress.addressFields.postal.value,
      };

      const responseJSON = {
        id: response.id,
        sessionData: response.sessionData,
        imagePath: adyenURL,
        adyenDescriptions: paymentMethodDescriptions,
        amount: { value: paymentAmount.value, currency: currency },
        countryCode: countryCode,
        adyenConnectedTerminals: JSON.parse(connectedTerminals),
        shippingAddress: shippingAddress,
      };

      return responseJSON;
    } catch (error) {
		AdyenLogs.fatal_log(`Failed to create Adyen Checkout Session... ${error.toString()}`);
    }
}

/**
 * Complete a donation through adyenGiving
 */
function donate() {
  const adyenGiving = require('*/cartridge/scripts/adyenGiving');
  const responseUtils = require('*/cartridge/scripts/util/Response');
  let req;
  try {
    req = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
  } catch (e) {
    AdyenLogs.error_log(e);
  }

  const { pspReference } = req;
  const { orderNo } = req;
  const donationAmount = {
    value: req.amountValue,
    currency: req.amountCurrency,
  };
  const donationResult = adyenGiving.donate(
    orderNo,
    donationAmount,
    pspReference,
  );

  responseUtils.renderJSON({ response: donationResult.response });
}

/**
 * Make a request to Adyen to get payment methods based on countryCode. Called from COBilling-Start
 */
function getPaymentMethods(cart, customer) {
  const Locale = require('dw/util/Locale');
  let countryCode = Locale.getLocale(request.getLocale()).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0 &&
    currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode()
      .value.toUpperCase();
  }
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  const PaymentMgr = require('dw/order/PaymentMgr');
  const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  const response = getPaymentMethods.getMethods(
    cart.object,
    customer,
    countryCode,
  );
  const paymentMethodDescriptions = response.paymentMethods.map((method) => ({
    brandCode: method.type,
    description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
  }));
  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;

  let connectedTerminals = {};
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    try {
      const connectedTerminalsResponse = adyenTerminalApi.getTerminals()
        .response;
      if (connectedTerminalsResponse) {
        connectedTerminals = JSON.parse(connectedTerminalsResponse);
      }
    } catch (e) {
      // Error parsing terminal response
    }
  }

  const currency = currentBasket.getTotalGrossPrice().currencyCode;
  const paymentAmount = currentBasket.getTotalGrossPrice().isAvailable()
      ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
      : new dw.value.Money(1000, currency);

  const shippingForm = session.forms.singleshipping;
  const shippingAddress = {
    firstName:  shippingForm.shippingAddress.addressFields.firstName.value,
    lastName:  shippingForm.shippingAddress.addressFields.lastName.value,
    address1:  shippingForm.shippingAddress.addressFields.address1.value,
    city:  shippingForm.shippingAddress.addressFields.city.value,
    country:  shippingForm.shippingAddress.addressFields.country.value,
    phone:  shippingForm.shippingAddress.addressFields.phone.value,
    postalCode:  shippingForm.shippingAddress.addressFields.postal.value,
  };
  const jsonResponse = {
    adyenPaymentMethods: response,
    adyenConnectedTerminals: connectedTerminals,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    amount: { value: paymentAmount.value, currency: currency },
    countryCode: countryCode,
    shippingAddress:shippingAddress,
  };

  return jsonResponse;
}

/**
 * Clear system session data
 */
function clearAdyenData(paymentInstrument) {
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenMD = null;
    paymentInstrument.paymentTransaction.custom.Adyen_authResult = null;
  });
}

/**
 * Clear system session data
 */
function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.singleshipping.clearFormElement();
  session.forms.multishipping.clearFormElement();
  session.forms.billing.clearFormElement();

  clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.privacy.adyenResponse = null;
  session.privacy.paymentMethod = null;
  session.privacy.orderNo = null;
  session.privacy.adyenBrandCode = null;
  session.privacy.adyenIssuerID = null;
}

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

exports.Notify = guard.ensure(['post'], notify);

exports.ShowConfirmation = guard.httpsGet(showConfirmation);

exports.ShowConfirmationPaymentFromComponent = guard.ensure(
  ['https'],
  showConfirmationPaymentFromComponent,
);

exports.Redirect3DS1Response = guard.ensure(
    ['https'],
    Redirect3DS1Response,
);

exports.GetPaymentMethods = getPaymentMethods;

exports.Sessions = sessions;

exports.getExternalPlatformVersion = getExternalPlatformVersion();

exports.PaymentFromComponent = guard.ensure(
  ['https', 'post'],
    paymentFromComponent,
);

exports.ZeroAuth = guard.ensure(
    ['https', 'post'],
    zeroAuth,
);

exports.PaymentsDetails = guard.ensure(
    ['https', 'post'],
    paymentsDetails,
);

exports.Donate = guard.ensure(['https', 'post'], donate);
