"use strict";

const server = require("server");
const URLUtils = require("dw/web/URLUtils");
const Transaction = require("dw/system/Transaction");
const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
require("*/cartridge/scripts/checkout/adyenHelpers");
const OrderMgr = require("dw/order/OrderMgr");
const CustomerMgr = require("dw/customer/CustomerMgr");
const Resource = require("dw/web/Resource");
require("dw/system/Site");
const Logger = require("dw/system/Logger");
const AdyenHelper = require("*/cartridge/scripts/util/AdyenHelper");
const constants = require("*/cartridge/adyenConstants/constants");
const collections = require("*/cartridge/scripts/util/collections");

const EXTERNAL_PLATFORM_VERSION = "SFRA";

server.get("Adyen3D", server.middleware.https, function (req, res, next) {
  const IssuerURL = req.querystring.IssuerURL;
  const PaRequest = req.querystring.PaRequest;
  const MD = req.querystring.MD;
  const TermURL = URLUtils.https("Adyen-AuthorizeWithForm");

  res.render("adyenform", {
    issuerUrl: IssuerURL,
    paRequest: PaRequest,
    md: MD,
    ContinueURL: TermURL,
  });
  next();
});

server.post("AuthorizeWithForm", server.middleware.https, function (
  req,
  res,
  next
) {
  const adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
  let paymentInstrument;
  let order;

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      paymentInstrument = order.getPaymentInstruments(
        session.privacy.paymentMethod
      )[0];
    } catch (e) {
      Logger.getLogger("Adyen").error(
        "Unable to retrieve order data from session."
      );
      res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
      return next();
    }

    if (session.privacy.MD === req.form.MD) {
      const jsonRequest = {
        paymentData: paymentInstrument.custom.adyenPaymentData,
        details: {
          MD: req.form.MD,
          PaRes: req.form.PaRes,
        },
      };
      const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);

      Transaction.wrap(function () {
        paymentInstrument.custom.adyenPaymentData = null;
      });
      // if error, return to checkout page
      if (result.error || result.resultCode !== "Authorised") {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order);
        });
        res.redirect(
          URLUtils.url(
            "Checkout-Begin",
            "stage",
            "payment",
            "paymentError",
            Resource.msg("error.payment.not.valid", "checkout", null)
          )
        );
        return next();
      }

      //custom fraudDetection
      const fraudDetectionStatus = { status: "success" };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus
      );
      if (placeOrderResult.error) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order);
        });
        res.redirect(
          URLUtils.url(
            "Checkout-Begin",
            "stage",
            "placeOrder",
            "paymentError",
            Resource.msg("error.technical", "checkout", null)
          )
        );
        return next();
      }

      Transaction.begin();
      AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
      order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
      order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
      Transaction.commit();
      COHelpers.sendConfirmationEmail(order, req.locale.id);
      clearForms();
      res.redirect(
        URLUtils.url(
          "Order-Confirm",
          "ID",
          order.orderNo,
          "token",
          order.orderToken
        ).toString()
      );
      return next();
    }
  }
  Logger.getLogger("Adyen").error("Session variable does not exists");
  res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
  return next();
});

server.get("Adyen3DS2", server.middleware.https, function (req, res, next) {
  const protocol = req.https ? "https" : "http";
  const adyenGetOriginKey = require("*/cartridge/scripts/adyenGetOriginKey");

  try {
    const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
      protocol,
      req.host
    );
    const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const resultCode = req.querystring.resultCode;
    const token3ds2 = req.querystring.token3ds2;
    res.render("/threeds2/adyen3ds2", {
      locale: request.getLocale(),
      originKey: originKey,
      environment: environment,
      resultCode: resultCode,
      token3ds2: token3ds2,
    });
  } catch (err) {
    Logger.getLogger("Adyen").error(
      "3DS2 redirect failed with reason: " + err.toString()
    );
    res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
  }

  return next();
});

server.post("Authorize3DS2", server.middleware.https, function (
  req,
  res,
  next
) {
  const adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
  let paymentInstrument;
  let order;
  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      paymentInstrument = order.getPaymentInstruments(
        session.privacy.paymentMethod
      )[0];
    } catch (e) {
      Logger.getLogger("Adyen").error(
        "Unable to retrieve order data from session 3DS2."
      );
      res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
      return next();
    }

    let details = {};
    if (
      req.form.resultCode === "IdentifyShopper" &&
      req.form.fingerprintResult
    ) {
      details = {
        "threeds2.fingerprint": req.form.fingerprintResult,
      };
    } else if (
      req.form.resultCode === "ChallengeShopper" &&
      req.form.challengeResult
    ) {
      details = {
        "threeds2.challengeResult": req.form.challengeResult,
      };
    } else {
      Logger.getLogger("Adyen").error("paymentDetails 3DS2 not available");
      res.redirect(
        URLUtils.url(
          "Checkout-Begin",
          "stage",
          "payment",
          "paymentError",
          Resource.msg("error.payment.not.valid", "checkout", null)
        )
      );
      return next();
    }

    const paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: details,
    };

    const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);

    if (
      (result.error || result.resultCode !== "Authorised") &&
      result.resultCode !== "ChallengeShopper"
    ) {
      //Payment failed
      Transaction.wrap(function () {
        OrderMgr.failOrder(order);
        paymentInstrument.custom.adyenPaymentData = null;
      });
      res.redirect(
        URLUtils.url(
          "Checkout-Begin",
          "stage",
          "payment",
          "paymentError",
          Resource.msg("error.payment.not.valid", "checkout", null)
        )
      );
      return next();
    } else if (result.resultCode === "ChallengeShopper") {
      //Redirect to ChallengeShopper
      res.redirect(
        URLUtils.url(
          "Adyen-Adyen3DS2",
          "resultCode",
          result.resultCode,
          "token3ds2",
          result.authentication["threeds2.challengeToken"]
        )
      );
      return next();
    }

    //delete paymentData from requests
    Transaction.wrap(function () {
      paymentInstrument.custom.adyenPaymentData = null;
    });

    //custom fraudDetection
    const fraudDetectionStatus = { status: "success" };

    // Places the order
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order);
      });
      res.redirect(
        URLUtils.url(
          "Checkout-Begin",
          "stage",
          "placeOrder",
          "paymentError",
          Resource.msg("error.technical", "checkout", null)
        )
      );
      return next();
    }

    Transaction.begin();
    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    Transaction.commit();
    COHelpers.sendConfirmationEmail(order, req.locale.id);
    clearForms();
    res.redirect(
      URLUtils.url(
        "Order-Confirm",
        "ID",
        order.orderNo,
        "token",
        order.orderToken
      ).toString()
    );
    return next();
  }

  Logger.getLogger("Adyen").error("Session variables for 3DS2 do not exists");
  res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
  return next();
});

server.get("Redirect", server.middleware.https, function (req, res, next) {
  const signature = req.querystring.signature;
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  if (order && signature) {
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT
    );
    let adyenPaymentInstrument;
    let paymentData;

    //looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }
    const currentSignature = AdyenHelper.getAdyenHash(
      req.querystring.redirectUrl,
      paymentData
    );

    if (signature === currentSignature) {
      res.redirect(req.querystring.redirectUrl);
      return next();
    }
  } else {
    Logger.getLogger("Adyen").error(
      "No signature or no order with orderNo " + session.privacy.orderNo
    );
  }

  Logger.getLogger("Adyen").error("Redirect signature is not correct");
  Transaction.wrap(function () {
    OrderMgr.failOrder(order);
  });
  res.redirect(
    URLUtils.url(
      "Checkout-Begin",
      "stage",
      "payment",
      "paymentError",
      Resource.msg("error.payment.not.valid", "checkout", null)
    )
  );
  return next();
});

server.get("ShowConfirmation", server.middleware.https, function (
  req,
  res,
  next
) {
  try {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT
    );
    let adyenPaymentInstrument;
    let paymentData;
    let details;

    //looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }

    //details is either redirectResult or payload
    if (req.querystring.redirectResult) {
      details = { redirectResult: req.querystring.redirectResult };
    } else if (req.querystring.payload) {
      details = { payload: req.querystring.payload };
    }

    //redirect to payment/details
    const adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
    const requestObject = {
      details: details,
      paymentData: paymentData,
    };

    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    Transaction.wrap(function () {
      adyenPaymentInstrument.custom.adyenPaymentData = null;
    });

    // Authorised: The payment authorisation was successfully completed.
    if (
      result.resultCode === "Authorised" ||
      result.resultCode === "Pending" ||
      result.resultCode === "Received"
    ) {
      if (
        result.resultCode === "Received" &&
        result.paymentMethod.indexOf("alipay_hk") > -1
      ) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order);
        });
        Logger.getLogger("Adyen").error(
          "Did not complete Alipay transaction, result: " +
            JSON.stringify(result)
        );
        res.redirect(
          URLUtils.url(
            "Checkout-Begin",
            "stage",
            "payment",
            "paymentError",
            Resource.msg("error.payment.not.valid", "checkout", null)
          )
        );
        return next();
      }

      //custom fraudDetection
      const fraudDetectionStatus = { status: "success" };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus
      );
      if (placeOrderResult.error) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order);
        });
        res.redirect(
          URLUtils.url(
            "Checkout-Begin",
            "stage",
            "placeOrder",
            "paymentError",
            Resource.msg("error.technical", "checkout", null)
          )
        );
        return next();
      }

      const OrderModel = require("*/cartridge/models/order");
      const Locale = require("dw/util/Locale");
      const currentLocale = Locale.getLocale(req.locale.id);
      const orderModel = new OrderModel(order, {
        countryCode: currentLocale.country,
      });

      //Save orderModel to custom object during session
      Transaction.wrap(function () {
        order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
        AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
      });

      clearForms();
      res.redirect(
        URLUtils.url(
          "Order-Confirm",
          "ID",
          order.orderNo,
          "token",
          order.orderToken
        ).toString()
      );
      return next();
    } else {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      res.redirect(
        URLUtils.url(
          "Checkout-Begin",
          "stage",
          "placeOrder",
          "paymentError",
          Resource.msg("error.technical", "checkout", null)
        )
      );
      return next();
    }
  } catch (e) {
    Logger.getLogger("Adyen").error(
      "Could not verify /payment/details: " + e.message
    );
    res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
    return next();
  }
});

server.post(
  "ShowConfirmationPaymentFromComponent",
  server.middleware.https,
  function (req, res, next) {
    try {
      const stateData = JSON.parse(req.form.additionalDetailsHidden);
      const order = OrderMgr.getOrder(session.privacy.orderNo);
      const paymentInstruments = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT
      );
      let adyenPaymentInstrument;

      const paymentData = stateData.paymentData;
      const details = stateData.details;

      // looping through all Adyen payment methods, however, this only can be one.
      const instrumentsIter = paymentInstruments.iterator();
      while (instrumentsIter.hasNext()) {
        adyenPaymentInstrument = instrumentsIter.next();
      }

      //redirect to payment/details
      const adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
      const requestObject = {
        details: details,
        paymentData: paymentData,
      };

      const result = adyenCheckout.doPaymentDetailsCall(requestObject);
      Transaction.wrap(function () {
        adyenPaymentInstrument.custom.adyenPaymentData = null;
      });
      // Authorised: The payment authorisation was successfully completed.
      if (
        result.resultCode === "Authorised" ||
        result.resultCode === "Pending" ||
        result.resultCode === "Received"
      ) {
        //custom fraudDetection
        const fraudDetectionStatus = { status: "success" };

        // Places the order
        const placeOrderResult = COHelpers.placeOrder(
          order,
          fraudDetectionStatus
        );
        if (placeOrderResult.error) {
          Transaction.wrap(function () {
            OrderMgr.failOrder(order);
          });
          res.redirect(
            URLUtils.url(
              "Checkout-Begin",
              "stage",
              "placeOrder",
              "paymentError",
              Resource.msg("error.technical", "checkout", null)
            )
          );
          return next();
        }

        const OrderModel = require("*/cartridge/models/order");
        const Locale = require("dw/util/Locale");
        const currentLocale = Locale.getLocale(req.locale.id);
        const orderModel = new OrderModel(order, {
          countryCode: currentLocale.country,
        });

        //Save orderModel to custom object during session
        Transaction.wrap(function () {
          order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
          AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
        });

        clearForms();
        res.redirect(
          URLUtils.https(
            "Order-Confirm",
            "ID",
            order.orderNo,
            "token",
            order.orderToken
          ).toString()
        );
        return next();
      } else {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
        });
        res.redirect(
          URLUtils.url(
            "Checkout-Begin",
            "stage",
            "placeOrder",
            "paymentError",
            Resource.msg("error.technical", "checkout", null)
          )
        );
        return next();
      }
    } catch (e) {
      Logger.getLogger("Adyen").error(
        "Could not verify /payment/details: " + e.message
      );
      res.redirect(URLUtils.url("Error-ErrorCode", "err", "general"));
      return next();
    }
  }
);

server.get("GetPaymentMethods", server.middleware.https, function (
  req,
  res,
  next
) {
  const BasketMgr = require("dw/order/BasketMgr");
  const Resource = require("dw/web/Resource");
  const getPaymentMethods = require("*/cartridge/scripts/adyenGetPaymentMethods");
  const adyenTerminalApi = require("*/cartridge/scripts/adyenTerminalApi");
  const PaymentMgr = require("dw/order/PaymentMgr");
  const Locale = require("dw/util/Locale");

  let countryCode = Locale.getLocale(req.locale.id).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0 &&
    currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode().value;
  }
  let response;
  let paymentMethodDescriptions = [];
  let customer;
  try {
    if (req.currentCustomer.profile) {
      customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
      );
    }
    response = getPaymentMethods.getMethods(
      BasketMgr.getCurrentBasket(),
      customer ? customer : null,
      countryCode
    );
    paymentMethodDescriptions = response.paymentMethods.map(function (method) {
      return {
        brandCode: method.type,
        description: Resource.msg("hpp.description." + method.type, "hpp", ""),
      };
    });
  } catch (err) {
    Logger.getLogger("Adyen").error(
      "Error retrieving Payment Methods. Error message: " +
        err.message +
        " more details: " +
        err.toString() +
        " in " +
        err.fileName +
        ":" +
        err.lineNumber
    );
    response = [];
    return next();
  }

  let connectedTerminals = {};
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    connectedTerminals = adyenTerminalApi.getTerminals().response;
  }

  const adyenURL = AdyenHelper.getLoadingContext() + "images/logos/medium/";
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
  };
  if (AdyenHelper.getCreditCardInstallments()) {
    const paymentAmount = currentBasket.getTotalGrossPrice()
      ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
      : 1000;
    const currency = currentBasket.getTotalGrossPrice().currencyCode;
    jsonResponse.amount = { value: paymentAmount, currency: currency };
    jsonResponse.countryCode = countryCode;
  }

  res.json(jsonResponse);
  return next();
});

server.post("Donate", server.middleware.https, function (req /*, res, next */) {
  const adyenGiving = require("*/cartridge/scripts/adyenGiving");
  const pspReference = req.form.pspReference;
  const orderNo = req.form.orderNo;
  const donationAmount = {
    value: req.form.amountValue,
    currency: req.form.amountCurrency,
  };
  const donationResult = adyenGiving.donate(
    orderNo,
    donationAmount,
    pspReference
  );

  return donationResult.response;
});

/**
 * Make a payment from inside a component (paypal)
 */
server.post("PaymentFromComponent", server.middleware.https, function (
  req,
  res,
  next
) {
  let order;
  const adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
  const BasketMgr = require("dw/order/BasketMgr");
  const reqDataObj = JSON.parse(req.form.data);

  if (reqDataObj.cancelTransaction) {
    order = OrderMgr.getOrder(session.privacy.orderNo);
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    res.json({ result: "cancelled" });
    return next();
  }
  const currentBasket = BasketMgr.getCurrentBasket();

  let paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice
    );

    paymentInstrument.custom.adyenPaymentData = req.form.data;
    session.privacy.paymentMethod = paymentInstrument.paymentMethod;
    paymentInstrument.custom.adyenPaymentMethod = reqDataObj.paymentMethod.type;
  });
  order = COHelpers.createOrder(currentBasket);
  session.privacy.orderNo = order.orderNo;

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });
  res.json(result);
  return next();
});

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post("Notify", server.middleware.https, function (req, res, next) {
  const checkAuth = require("*/cartridge/scripts/checkNotificationAuth");
  const status = checkAuth.check(req);
  if (!status) {
    res.render("/adyen/error");
    return {};
  }
  const handleNotify = require("*/cartridge/scripts/handleNotify");
  Transaction.begin();
  const notificationResult = handleNotify.notify(req.form);

  if (notificationResult.success) {
    Transaction.commit();
    res.render("/notify");
  } else {
    res.render("/notifyError", {
      errorMessage: notificationResult.errorMessage,
    });
    Transaction.rollback();
  }
  next();
});

/**
 * Clear system session data
 */
function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.billing.clearFormElement();
  clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.privacy.paymentMethod = null;
  session.privacy.orderNo = null;
  session.privacy.brandCode = null;
  session.privacy.issuer = null;
  session.privacy.adyenPaymentMethod = null;
  session.privacy.adyenIssuerName = null;
  session.privacy.ratePayFingerprint = null;
}

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
