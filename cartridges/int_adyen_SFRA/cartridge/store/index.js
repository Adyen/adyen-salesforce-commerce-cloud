"use strict";

var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13;
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
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
  _createClass(Store, [{
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
      this.componentsObj[method][key] = val;
    }
  }]);
  return Store;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "checkout", [observable], {
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
}), _applyDecoratedDescriptor(_class.prototype, "maskedCardNumber", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "maskedCardNumber"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "selectedPayment", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "selectedPayment"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "selectedPaymentIsValid", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "selectedPaymentIsValid"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "stateData", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "stateData"), _class.prototype)), _class);
module.exports = new Store();