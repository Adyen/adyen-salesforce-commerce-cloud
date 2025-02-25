"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
// eslint-disable-next-line
var _require = require('mobx'),
  observable = _require.observable,
  computed = _require.computed;
var Store = (_class = /*#__PURE__*/function () {
  function Store() {
    _classCallCheck(this, Store);
    _defineProperty(this, "MASKED_CC_PREFIX", '************');
    _initializerDefineProperty(this, "checkout", _descriptor, this);
    _initializerDefineProperty(this, "endDigits", _descriptor2, this);
    _initializerDefineProperty(this, "selectedMethod", _descriptor3, this);
    _initializerDefineProperty(this, "componentsObj", _descriptor4, this);
    _initializerDefineProperty(this, "checkoutConfiguration", _descriptor5, this);
    _initializerDefineProperty(this, "formErrorsExist", _descriptor6, this);
    _initializerDefineProperty(this, "isValid", _descriptor7, this);
    _initializerDefineProperty(this, "paypalTerminatedEarly", _descriptor8, this);
    _initializerDefineProperty(this, "componentState", _descriptor9, this);
    _initializerDefineProperty(this, "brand", _descriptor10, this);
    _initializerDefineProperty(this, "partialPaymentsOrderObj", _descriptor11, this);
    _initializerDefineProperty(this, "giftCardComponentListenersAdded", _descriptor12, this);
    _initializerDefineProperty(this, "addedGiftCards", _descriptor13, this);
  }
  return _createClass(Store, [{
    key: "maskedCardNumber",
    get: function get() {
      return "".concat(this.MASKED_CC_PREFIX).concat(this.endDigits);
    }
  }, {
    key: "selectedPayment",
    get: function get() {
      return this.componentsObj[this.selectedMethod];
    }
  }, {
    key: "selectedPaymentIsValid",
    get: function get() {
      var _this$selectedPayment;
      return !!((_this$selectedPayment = this.selectedPayment) !== null && _this$selectedPayment !== void 0 && _this$selectedPayment.isValid);
    }
  }, {
    key: "stateData",
    get: function get() {
      var _this$selectedPayment2;
      return ((_this$selectedPayment2 = this.selectedPayment) === null || _this$selectedPayment2 === void 0 ? void 0 : _this$selectedPayment2.stateData) || {
        paymentMethod: _objectSpread({
          type: this.selectedMethod
        }, this.brand ? {
          brand: this.brand
        } : undefined)
      };
    }
  }, {
    key: "updateSelectedPayment",
    value: function updateSelectedPayment(method, key, val) {
      if (!this.componentsObj[method]) {
        this.componentsObj[method] = {};
      }
      this.componentsObj[method][key] = val;
    }
  }]);
}(), _descriptor = _applyDecoratedDescriptor(_class.prototype, "checkout", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "endDigits", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "selectedMethod", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, "componentsObj", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return {};
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, "checkoutConfiguration", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return window.Configuration || {};
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, "formErrorsExist", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, "isValid", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, "paypalTerminatedEarly", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, "componentState", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return {};
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, "brand", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, "partialPaymentsOrderObj", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor12 = _applyDecoratedDescriptor(_class.prototype, "giftCardComponentListenersAdded", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor13 = _applyDecoratedDescriptor(_class.prototype, "addedGiftCards", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, "maskedCardNumber", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "maskedCardNumber"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "selectedPayment", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "selectedPayment"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "selectedPaymentIsValid", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "selectedPaymentIsValid"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "stateData", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "stateData"), _class.prototype), _class);
module.exports = new Store();