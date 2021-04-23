"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var constants = require('*/cartridge/adyenConstants/constants');

var _require = require('../../../utils/index'),
    clearForms = _require.clearForms;

var handleError = require('./error');

var handleInvalidPayment = require('./payment');

var handleOrderConfirmation = require('./order');

function checkForValidRequest(result, order, merchantRefOrder, options) {
  var res = options.res,
      next = options.next; // If invalid payments/details call, return back to home page

  if (result.invalidRequest) {
    Logger.getLogger('Adyen').error("Invalid request for order ".concat(order.orderNo));
    res.redirect(URLUtils.httpHome());
    return next();
  } // if error, return to checkout page


  if (result.error || result.resultCode !== 'Authorised') {
    return handleInvalidPayment(merchantRefOrder, 'payment', options);
  }

  return true;
} // eslint-disable-next-line consistent-return


function authorize(paymentInstrument, order, options) {
  var req = options.req;
  var jsonRequest = {
    paymentData: paymentInstrument.custom.adyenPaymentData,
    details: {
      MD: req.form.MD,
      PaRes: req.form.PaRes
    }
  };
  var result = adyenCheckout.doPaymentDetailsCall(jsonRequest);
  clearForms.clearAdyenData(paymentInstrument);
  var merchantRefOrder = OrderMgr.getOrder(result.merchantReference);
  var isValid = checkForValidRequest(result, order, merchantRefOrder, options);

  if (isValid) {
    // custom fraudDetection
    var fraudDetectionStatus = {
      status: 'success'
    }; // Places the order

    var _COHelpers$placeOrder = COHelpers.placeOrder(merchantRefOrder, fraudDetectionStatus),
        error = _COHelpers$placeOrder.error;

    var orderConfirmationArgs = [paymentInstrument, result, merchantRefOrder, options];
    return error ? handleInvalidPayment(merchantRefOrder, 'placeOrder', options) : handleOrderConfirmation.apply(void 0, orderConfirmationArgs);
  }
}

function handleAuthorize(options) {
  var req = options.req;
  var order = OrderMgr.getOrder(req.querystring.merchantReference);

  var _order$getPaymentInst = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT).toArray(),
      _order$getPaymentInst2 = _slicedToArray(_order$getPaymentInst, 1),
      paymentInstrument = _order$getPaymentInst2[0];

  var hasValidMD = paymentInstrument.custom.adyenMD === req.form.MD;
  return hasValidMD ? authorize(paymentInstrument, order, options) : handleError('Not a valid MD', options);
}

module.exports = handleAuthorize;