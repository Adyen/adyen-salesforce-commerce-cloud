"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var BasketMgr = require('dw/order/BasketMgr');

var paymentResponseHandler = require('../paymentResponse');

var paymentInstrument;
var orderNumber = 'mocked_order_number';
beforeEach(function () {
  var _BasketMgr$toArray = BasketMgr.toArray();

  var _BasketMgr$toArray2 = _slicedToArray(_BasketMgr$toArray, 1);

  paymentInstrument = _BasketMgr$toArray2[0];
});
describe('Payment Response Handler', function () {
  it('should get 3ds2 response', function () {
    var result = {
      threeDS2: true,
      resultCode: 'mocked_result_code',
      fullResponse: {
        action: 'mocked_action'
      }
    };
    var response = paymentResponseHandler(paymentInstrument, result, orderNumber);
    expect(response).toMatchSnapshot();
  });
  it('should get redirect response with payment data signature', function () {
    var result = {
      threeDS2: false,
      resultCode: 'mocked_result_code',
      paymentData: 'mocked_payment_data',
      redirectObject: {
        url: 'mocked_redirect_url'
      }
    };
    var response = paymentResponseHandler(paymentInstrument, result, orderNumber);
    expect(response).toMatchSnapshot();
  });
  it('should get redirect response with md signature', function () {
    var result = {
      threeDS2: false,
      resultCode: 'mocked_result_code',
      paymentData: 'mocked_payment_data',
      redirectObject: {
        data: {
          MD: 'mocked_redirect_MD'
        },
        url: 'mocked_redirect_url'
      }
    };
    var response = paymentResponseHandler(paymentInstrument, result, orderNumber);
    expect(response).toMatchSnapshot();
  });
});