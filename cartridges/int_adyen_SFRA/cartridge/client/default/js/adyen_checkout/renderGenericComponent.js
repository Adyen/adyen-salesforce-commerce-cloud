"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var store = require('../../../../store');

var _require = require('./renderPaymentMethod'),
    renderPaymentMethod = _require.renderPaymentMethod;

var helpers = require('./helpers');

function addPosTerminals(terminals) {
  var ddTerminals = document.createElement('select');
  ddTerminals.id = 'terminalList';
  Object.keys(terminals).forEach(function (t) {
    var option = document.createElement('option');
    option.value = terminals[t];
    option.text = terminals[t];
    ddTerminals.appendChild(option);
  });
  document.querySelector('#adyenPosTerminals').append(ddTerminals);
}
/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */


function getPaymentMethods(paymentMethods) {
  $.ajax({
    url: window.getPaymentMethodsURL,
    type: 'get',
    success: function success(data) {
      paymentMethods(data);
    }
  });
}

function resolveUnmount(key, val) {
  try {
    return Promise.resolve(val.node.unmount("component_".concat(key)));
  } catch (e) {
    // try/catch block for val.unmount
    return Promise.resolve(false);
  }
}
/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */


function unmountComponents() {
  var promises = Object.entries(store.componentsObj).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        val = _ref2[1];

    delete store.componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}
/**
 * checks if payment method is blocked and returns a boolean accordingly
 */


function isMethodTypeBlocked(methodType) {
  var blockedMethods = ['bcmc_mobile_QR', 'applepay', 'cup', 'wechatpay', 'wechatpay_pos', 'wechatpaySdk', 'wechatpayQr'];
  return blockedMethods.includes(methodType);
}

function renderStoredPaymentMethod(data) {
  return function (pm) {
    if (pm.supportedShopperInteractions.includes('Ecommerce')) {
      renderPaymentMethod(pm, true, data.ImagePath);
    }
  };
}

function renderStoredPaymentMethods(data) {
  if (data.AdyenPaymentMethods.storedPaymentMethods) {
    var storedPaymentMethods = store.checkout.paymentMethodsResponse.storedPaymentMethods;
    storedPaymentMethods.forEach(renderStoredPaymentMethod(data));
  }
}

function renderPaymentMethods(data) {
  data.AdyenPaymentMethods.paymentMethods.forEach(function (pm, i) {
    return !isMethodTypeBlocked(pm.type) && renderPaymentMethod(pm, false, data.ImagePath, data.AdyenDescriptions[i].description);
  });
}

function renderPosTerminals(data) {
  var _data$AdyenConnectedT, _data$AdyenConnectedT2;

  var removeChilds = function removeChilds() {
    var posTerminals = document.querySelector('#adyenPosTerminals');

    while (posTerminals.firstChild) {
      posTerminals.removeChild(posTerminals.firstChild);
    }
  };

  if ((_data$AdyenConnectedT = data.AdyenConnectedTerminals) !== null && _data$AdyenConnectedT !== void 0 && (_data$AdyenConnectedT2 = _data$AdyenConnectedT.uniqueTerminalIds) !== null && _data$AdyenConnectedT2 !== void 0 && _data$AdyenConnectedT2.length) {
    removeChilds();
    addPosTerminals(data.AdyenConnectedTerminals.uniqueTerminalIds);
  }
}

function setCheckoutConfiguration(data) {
  var setField = function setField(key, val) {
    return val && _defineProperty({}, key, val);
  };

  store.checkoutConfiguration = _objectSpread(_objectSpread(_objectSpread({}, store.checkoutConfiguration), setField('amount', data.amount)), setField('countryCode', data.countryCode));
}
/**
 * Calls getPaymenMethods and then renders the retrieved payment methods (including card component)
 */


module.exports.renderGenericComponent = /*#__PURE__*/function () {
  var _renderGenericComponent = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(Object.keys(store.componentsObj).length !== 0)) {
              _context.next = 3;
              break;
            }

            _context.next = 3;
            return unmountComponents();

          case 3:
            getPaymentMethods(function (data) {
              store.checkoutConfiguration.paymentMethodsResponse = data.AdyenPaymentMethods;
              setCheckoutConfiguration(data);
              store.checkout = new AdyenCheckout(store.checkoutConfiguration);
              document.querySelector('#paymentMethodsList').innerHTML = '';
              renderStoredPaymentMethods(data);
              renderPaymentMethods(data);
              renderPosTerminals(data);
              var firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
              firstPaymentMethod.checked = true;
              helpers.displaySelectedMethod(firstPaymentMethod.value);
            });

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  function renderGenericComponent() {
    return _renderGenericComponent.apply(this, arguments);
  }

  return renderGenericComponent;
}();