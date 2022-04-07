"use strict";

/* API Includes */
var URLUtils = require('dw/web/URLUtils');

var PaymentMgr = require('dw/order/PaymentMgr');

var Resource = require('dw/web/Resource');

var Transaction = require('dw/system/Transaction');

var constants = require('*/cartridge/adyenConstants/constants');
/* Script Modules */


var app = require(Resource.msg('scripts.app.js', 'require', null));

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');
/**
 * Creates a Adyen payment instrument for the given basket
 */


function Handle(args) {
  var currentBasket = args.Basket;
  var paymentInformation = app.getForm('adyPaydata');
  Transaction.wrap(function () {
    var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);

    if (result.error) {
      return result;
    }

    var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    paymentInstrument.custom.adyenPaymentData = paymentInformation.get('adyenStateData').value();
    session.privacy.adyenFingerprint = paymentInformation.get('adyenFingerprint').value();
  });
  return {
    success: true
  };
}
/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */


function Authorize(args) {
  var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

  var order = args.Order;
  var paymentInstrument = args.PaymentInstrument;
  var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
  Transaction.begin();
  paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  var orderCustomer = order.getCustomer();
  var sessionCustomer = session.getCustomer();

  if (orderCustomer.authenticated && orderCustomer.ID !== sessionCustomer.ID) {
    Logger.getLogger('Adyen').error('orderCustomer is not the same as the sessionCustomer');
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    return {
      error: true,
      PlaceOrderError: 'orderCustomer is not the same as the sessionCustomer'
    };
  }

  var result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument
  });

  if (result.error) {
    Transaction.rollback();

    var _args = 'args' in result ? result.args : null;

    return {
      error: true,
      PlaceOrderError: !empty(_args) && 'AdyenErrorMessage' in _args && !empty(_args.AdyenErrorMessage) ? _args.AdyenErrorMessage : ''
    };
  }

  if (result.pspReference) {
    order.custom.Adyen_pspReference = result.pspReference;
  }

  if (result.threeDS2 || result.resultCode === constants.RESULTCODES.REDIRECTSHOPPER) {
    var _result$redirectObjec, _result$redirectObjec2;

    paymentInstrument.custom.adyenPaymentData = result.paymentData;
    Transaction.commit();

    if (result.threeDS2) {
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenAction = JSON.stringify(result.fullResponse.action);
      });
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https('Adyen-Redirect3DS2', 'merchantReference', order.orderNo, 'orderToken', order.getOrderToken(), 'utm_nooverride', '1'),
          resultCode: result.resultCode,
          token3ds2: result.token3ds2
        })
      };
    } // If the response has MD, then it is a 3DS transaction


    if ((_result$redirectObjec = result.redirectObject) !== null && _result$redirectObjec !== void 0 && (_result$redirectObjec2 = _result$redirectObjec.data) !== null && _result$redirectObjec2 !== void 0 && _result$redirectObjec2.MD) {
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenMD = result.redirectObject.data.MD;
      });
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https('Adyen-AuthorizeWithForm', 'merchantReference', order.orderNo, 'orderToken', order.getOrderToken(), 'utm_nooverride', '1'),
          Basket: order,
          issuerUrl: result.redirectObject.url,
          paRequest: result.redirectObject.data.PaReq,
          md: result.redirectObject.data.MD
        })
      };
    }

    return {
      order: order,
      paymentInstrument: paymentInstrument,
      redirectObject: result.redirectObject
    };
  }

  if (result.decision !== 'ACCEPT') {
    Transaction.rollback();
    return {
      error: true,
      PlaceOrderError: 'AdyenErrorMessage' in result && !empty(result.adyenErrorMessage) ? result.adyenErrorMessage : ''
    };
  }

  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  Transaction.commit();
  return {
    authorized: true
  };
}

exports.Handle = Handle;
exports.Authorize = Authorize;