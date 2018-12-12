'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

const EXTERNAL_PLATFORM_VERSION = "SFRA";

server.get('Adyen3D', server.middleware.https, function (req, res, next) {
  var IssuerURL = req.querystring.IssuerURL;
  var PaRequest = req.querystring.PaRequest;
  var MD = req.querystring.MD;
  var TermURL = URLUtils.https('Adyen-AuthorizeWithForm');

  res.render('adyenform', {
    issuerUrl: IssuerURL,
    paRequest: PaRequest,
    md: MD,
    ContinueURL: TermURL
  });
  next();
});

server.post('AuthorizeWithForm', server.middleware.https, function (req, res, next) {
  var adyen3DVerification = require('int_adyen_overlay/cartridge/scripts/adyen3DVerification');
  var order = session.custom.order;
  var paymentInstrument = session.custom.paymentInstrument;
  if (session.custom.MD == req.form.MD) {
    var result = adyen3DVerification.verify({
      Order: order,
      Amount: paymentInstrument.paymentTransaction.amount,
      CurrentRequest: req.request,
      MD: req.form.MD,
      PaResponse: req.form.PaRes,
        PaymentData: paymentInstrument.custom.adyenPaymentData
    });

    // if error, return to checkout page
    if (result.error || result.Decision != 'ACCEPT') {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order);
      });
      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
      return next();
    }

    //custom fraudDetection
    var fraudDetectionStatus = {status: 'success'};

    // Places the order
    var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);
      if (placeOrderResult.error) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order);
      });
      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
      return next();
    }

    Transaction.begin();
    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    paymentInstrument.paymentTransaction.transactionID = result.RequestToken;
    Transaction.commit();
    COHelpers.sendConfirmationEmail(order, req.locale.id);
    clearForms();
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
    return next();
  }

  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
});

server.get('Redirect', server.middleware.https, function (req, res, next) {
  var	adyenVerificationSHA256 = require('int_adyen_overlay/cartridge/scripts/adyenRedirectVerificationSHA256');


  var result;
  var order = OrderMgr.getOrder(session.custom.orderNo);
  Transaction.wrap(function () {
    result = adyenVerificationSHA256.verify({
      Order: order,
      OrderNo: order.orderNo,
      CurrentSession: session,
      CurrentUser: customer,
      PaymentInstrument: order.paymentInstrument,
      brandCode: session.custom.brandCode,
      issuerId: session.custom.issuerId
    });
  });

  if (result === PIPELET_ERROR) {
    res.render('error');
    return next();
  }

  var pdict = {
    merchantSig:	result.merchantSig,
    Amount100: result.Amount100,
    shopperEmail: result.shopperEmail,
    shopperReference: result.shopperReference,
    ParamsMap: result.paramsMap,
    SessionValidity: result.sessionValidity,
    Order: order,
    OrderNo: order.orderNo
  };

  res.render('redirectHPP', pdict);
  return next();
});

server.get('ShowConfirmation', server.middleware.https, function (req, res, next) {
  var order = null;
  if (req.querystring.merchantReference) {
    order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
  }

  if (req.querystring.authResult.value != 'CANCELLED') {
    var requestMap = new Array();
    for (var item in req.querystring) {
      if (item !== 'toString') {
        requestMap[item] = req.querystring[item];
      }
    }

    var authorizeConfirmation = require('int_adyen_overlay/cartridge/scripts/authorizeConfirmationCallSHA256');
    var authorized = authorizeConfirmation.authorize(requestMap);
    if (!authorized) {
      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
      return next();
    }
  }
  // AUTHORISED: The payment authorisation was successfully completed.
  if (req.querystring.authResult == 'AUTHORISED') {
      var OrderModel = require('*/cartridge/models/order');
      var Locale = require('dw/util/Locale');

      var currentLocale = Locale.getLocale(req.locale.id);
      var orderModel = new OrderModel(order, { countryCode: currentLocale.country });

      //Save orderModel to custom object during session
      Transaction.wrap(function () {
          order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
      });

    clearForms();
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
    return next();
  }

  Transaction.wrap(function () {
    OrderMgr.failOrder(order);
  });

  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
});

server.get('GetPaymentMethods', server.middleware.https, function (req, res, next) {
  var BasketMgr = require('dw/order/BasketMgr');
  var Resource = require('dw/web/Resource');
  var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  var paymentMethods;
  try {
    paymentMethods = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket()).paymentMethods;
  } catch (err) {
    paymentMethods = [];
  }

  paymentMethods = paymentMethods.filter(function (method) { return method.type != "scheme"; });
  var descriptions = [];
  paymentMethods.forEach(function (method){
     descriptions.push({ brandCode : method.type, description : Resource.msg('hpp.description.' + method.type, 'hpp', "")});
   })

  res.json({
      AdyenHppPaymentMethods: paymentMethods,
      ImagePath: URLUtils.staticURL('/images/').toString(),
      AdyenDescriptions : descriptions
  });
  return next();
});

/**
 * Get OriginKey for Secured Fields
 */
server.get('GetConfigSecuredFields', server.middleware.https, function (req, res, next) {
    var adyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
    var	adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
    var baseUrl = req.querystring.protocol + "//" + Site.getCurrent().getHttpsHostName();
    var originKey;
    var error = false;
    var errorMessage = "";
    var loadingContext = "";

    try {
        originKey = adyenGetOriginKey.getOriginKey(baseUrl).originKeys;
        loadingContext = adyenHelper.getLoadingContext();
    } catch (err) {
        error = true;
        errorMessage = Resource.msg('load.component.error','creditCard', null);
    }
    res.json({
        error: error,
        errorMessage: errorMessage,
        adyenOriginKey: originKey,
        adyenLoadingContext: loadingContext
    });
    return next();
});

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var	checkAuth = require('int_adyen_overlay/cartridge/scripts/checkNotificationAuth');
    var status = checkAuth.check(req);
    if (!status) {
        res.render('/error');
        return {};
    }
    var	handleNotify = require('int_adyen_overlay/cartridge/scripts/handleNotify');
    Transaction.wrap(function () {
        handleNotify.notify(req.form);
    });
    res.render('/notify');
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
  session.custom.paymentInstrument = null;
  session.custom.order = null;
  session.custom.brandCode = null;
  session.custom.issuerId = null;
  session.custom.adyenPaymentMethod = null;
  session.custom.adyenIssuerName = null;
}

function getExternalPlatformVersion(){
    return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();