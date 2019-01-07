'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

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
    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    var order = session.custom.order;
    var paymentInstrument = session.custom.paymentInstrument;
    if (session.custom.MD == req.form.MD) {
        var jsonRequest = {
            "paymentData": paymentInstrument.custom.adyenPaymentData,
            "details": {
                "MD": req.form.MD,
                "PaRes": req.form.PaRes
            }
        };
        var result = adyenCheckout.doPaymentDetailsCall(jsonRequest);
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = "";
        });
        // if error, return to checkout page
        if (result.error || result.resultCode != 'Authorised') {
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
        paymentInstrument.paymentTransaction.transactionID = result.pspReference;
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
  res.redirect(req.querystring.redirectUrl);
  return next();
});

server.get('ShowConfirmation', server.middleware.https, function (req, res, next) {
    var payLoad = req.querystring.payload;

    //redirect to payment/details
    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    var requestObject = {};
    requestObject['details'] = {};
    requestObject.details['payload'] = payLoad;
    var result = adyenCheckout.doPaymentDetailsCall(requestObject);
    var order = OrderMgr.getOrder(result.merchantReference);

    // Authorised: The payment authorisation was successfully completed.
    if (result.resultCode == "Authorised") {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
        clearForms();
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
    }
    else {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    }
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
  session.custom.issuer = null;
  session.custom.adyenPaymentMethod = null;
  session.custom.adyenIssuerName = null;
}

module.exports = server.exports();
