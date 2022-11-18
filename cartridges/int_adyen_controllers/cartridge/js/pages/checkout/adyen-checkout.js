"use strict";

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
require('./adyen-giving');
require('./amazon');
require('./summary');
var qrCodeMethods = ['swish', 'wechatpayQR', 'bcmc_mobile', 'pix'];
var installmentLocales = ['pt_BR', 'ja_JP', 'tr_TR', 'es_MX'];
var maskedCardNumber;
var MASKED_CC_PREFIX = '************';
var selectedMethod;
var componentsObj = {};
var checkoutConfiguration;
var sessionsResponse;
var paymentMethodsResponse;
var checkout;
var formErrorsExist;
var isValid;
var paypalTerminatedEarly = false;
/**
 * @function
 * @description Initializes Adyen Secured Fields  Billing events
 */
function initializeBillingEvents() {
  return _initializeBillingEvents.apply(this, arguments);
}
function _initializeBillingEvents() {
  _initializeBillingEvents = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            $('#billing-submit').on('click', function () {
              var isAdyenPOS = document.querySelector('.payment-method-options :checked').value === 'AdyenPOS';
              var isAdyen = document.querySelector('.payment-method-options :checked').value === 'AdyenComponent';
              if (isAdyenPOS) {
                document.querySelector('#dwfrm_adyPaydata_terminalId').value = document.querySelector('#terminalList').value;
                return true;
              }
              if (isAdyen) {
                var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
                var paymentMethodLabel = document.querySelector("#lb_".concat(selectedMethod)).innerHTML;
                adyenPaymentMethod.value = paymentMethodLabel;
                validateComponents();
                return showValidation();
              }
            });
            if (!window.sessionsResponse) {
              _context2.next = 16;
              break;
            }
            sessionsResponse = window.sessionsResponse;
            checkoutConfiguration = window.Configuration;
            checkoutConfiguration.onChange = function (state /* , component */) {
              isValid = state.isValid;
              if (!componentsObj[selectedMethod]) {
                componentsObj[selectedMethod] = {};
              }
              componentsObj[selectedMethod].isValid = isValid;
              componentsObj[selectedMethod].stateData = state.data;
            };
            checkoutConfiguration.showPayButton = false;
            checkoutConfiguration.paymentMethodsConfiguration = {
              card: getCardConfig(),
              bcmc: getCardConfig(),
              storedCard: getCardConfig(),
              boletobancario: {
                personalDetailsRequired: true,
                // turn personalDetails section on/off
                billingAddressRequired: false,
                // turn billingAddress section on/off
                showEmailAddress: false // allow shopper to specify their email address
              },

              paywithgoogle: getGooglePayConfig(),
              googlepay: getGooglePayConfig(),
              paypal: {
                environment: window.Configuration.environment,
                showPayButton: true,
                onClick: function onClick(data, actions) {
                  if (paypalTerminatedEarly) {
                    paymentFromComponent({
                      cancelTransaction: true,
                      merchantReference: document.querySelector('#merchantReference').value
                    });
                    paypalTerminatedEarly = false;
                    return actions.resolve();
                  }
                  paypalTerminatedEarly = true;
                  $('#dwfrm_billing').trigger('submit');
                  if (formErrorsExist) {
                    paypalTerminatedEarly = false;
                    return actions.reject();
                  }
                },
                onSubmit: function onSubmit(state, component) {
                  assignPaymentMethodValue();
                  paymentFromComponent(state.data, component);
                  document.querySelector('#adyenStateData').value = JSON.stringify(state.data);
                },
                onCancel: function onCancel(data, component) {
                  paypalTerminatedEarly = false;
                  paymentFromComponent({
                    cancelTransaction: true,
                    merchantReference: document.querySelector('#merchantReference').value
                  }, component);
                },
                onError: function onError( /* error, component */
                ) {
                  paypalTerminatedEarly = false;
                  $('#dwfrm_billing').trigger('submit');
                },
                onAdditionalDetails: function onAdditionalDetails(state /* , component */) {
                  paypalTerminatedEarly = false;
                  document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(state.data);
                  $('#dwfrm_billing').trigger('submit');
                }
              },
              mbway: {
                showPayButton: true,
                onSubmit: function onSubmit(state, component) {
                  $('#dwfrm_billing').trigger('submit');
                  assignPaymentMethodValue();
                  if (formErrorsExist) {
                    return false;
                  }
                  document.getElementById('component_mbway').querySelector('button').disabled = true;
                  paymentFromComponent(state.data, component);
                  document.querySelector('#adyenStateData').value = JSON.stringify(state.data);
                },
                onError: function onError( /* error, component */
                ) {
                  $('#dwfrm_billing').trigger('submit');
                },
                onAdditionalDetails: function onAdditionalDetails(state /* , component */) {
                  document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(state.data);
                  $('#dwfrm_billing').trigger('submit');
                }
              },
              swish: getQRCodeConfig(),
              bcmc_mobile: getQRCodeConfig(),
              wechatpayQR: getQRCodeConfig(),
              pix: getQRCodeConfig(),
              amazonpay: getAmazonpayConfig()
            };
            if (window.googleMerchantID !== 'null' && window.Configuration.environment === 'live') {
              checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration.merchantIdentifier = window.googleMerchantID;
              checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration.merchantIdentifier = window.googleMerchantID;
            }
            if (window.cardholderNameBool !== 'null') {
              checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
              checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
            }
            checkoutConfiguration.session = {
              id: window.sessionsResponse.id,
              sessionData: window.sessionsResponse.sessionData
            };
            _context2.next = 12;
            return AdyenCheckout(checkoutConfiguration);
          case 12:
            checkout = _context2.sent;
            paymentMethodsResponse = checkout.paymentMethodsResponse;
            document.querySelector('#paymentMethodsList').innerHTML = '';
            renderGenericComponent();
          case 16:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _initializeBillingEvents.apply(this, arguments);
}
function zeroAuth(data, checkout) {
  $.ajax({
    url: window.zeroAuthURL,
    type: 'POST',
    contentType: 'application/; charset=utf-8',
    data: JSON.stringify(data),
    async: false,
    success: function success(data) {
      if (data.zeroAuthResult.action) {
        document.querySelector('#buttonsContainer').style.display = 'none';
        checkout.createFromAction(data.zeroAuthResult.action).mount('#newCard');
      }
      if (data.zeroAuthResult.resultCode === 'Authorised') {
        window.location.href = window.paymentInstrumentsList;
      } else if (data.zeroAuthResult.resultCode === 'Refused') {
        window.location.href = window.paymentInstrumentsListError;
      }
    }
  });
}
function paymentsDetails(state) {
  $.ajax({
    type: 'post',
    url: window.paymentsDetails,
    data: JSON.stringify({
      data: state.data
    }),
    contentType: 'application/; charset=utf-8',
    async: false,
    success: function success(data) {
      if (data.response.isSuccessful) {
        window.location.href = window.paymentInstrumentsList;
      } else if (!data.response.isFinal && _typeof(data.response.action) === 'object') {
        checkout.createFromAction(data.action).mount('#action-container');
      } else {
        window.location.href = window.paymentInstrumentsListError;
      }
    }
  });
}

/**
 * @function
 * @description Initializes Adyen Checkout My Account events
 */
function initializeAccountEvents() {
  return _initializeAccountEvents.apply(this, arguments);
}
function _initializeAccountEvents() {
  _initializeAccountEvents = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var newCard, adyenStateData, isValid, node;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            checkoutConfiguration = window.Configuration;
            checkoutConfiguration.onAdditionalDetails = function (state) {
              paymentsDetails(state);
            };
            checkoutConfiguration.session = window.sessionData;
            _context3.next = 5;
            return AdyenCheckout(checkoutConfiguration);
          case 5:
            checkout = _context3.sent;
            newCard = document.getElementById('newCard');
            isValid = false;
            node = checkout.create('card', {
              hasHolderName: true,
              holderNameRequired: true,
              onChange: function onChange(state) {
                adyenStateData = state.data;
                isValid = state.isValid;
              }
            }).mount(newCard);
            $('#applyBtn').on('click', function (e) {
              e.preventDefault();
              if (!isValid) {
                node.showValidation();
                return false;
              }
              document.querySelector('#adyenStateData').value = JSON.stringify(adyenStateData);
              zeroAuth(adyenStateData, checkout);
            });
          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _initializeAccountEvents.apply(this, arguments);
}
function assignPaymentMethodValue() {
  var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  adyenPaymentMethod.value = document.querySelector("#lb_".concat(selectedMethod)).innerHTML;
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function unmountComponents() {
  var promises = Object.entries(componentsObj).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      key = _ref2[0],
      val = _ref2[1];
    delete componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}
function resolveUnmount(key, val) {
  try {
    return Promise.resolve(val.node.unmount("component_".concat(key)));
  } catch (e) {
    // try/catch block for val.unmount
    return Promise.resolve(false);
  }
}
function displaySelectedMethod(type) {
  selectedMethod = type;
  resetPaymentMethod();
  if (['paypal', 'paywithgoogle', 'googlepay', 'mbway', 'amazonpay'].concat(qrCodeMethods).indexOf(type) > -1) {
    document.querySelector('#billing-submit').disabled = true;
  } else {
    document.querySelector('#billing-submit').disabled = false;
  }
  document.querySelector("#component_".concat(type)).setAttribute('style', 'display:block');
}
function resetPaymentMethod() {
  $('.additionalFields').hide();
}
function showValidation() {
  if (componentsObj[selectedMethod] && !componentsObj[selectedMethod].isValid) {
    componentsObj[selectedMethod].node.showValidation();
    return false;
  }
  return true;
}

/**
 * Assigns stateData value to the hidden stateData input field
 * so it's sent to the backend for processing
 */
function validateComponents() {
  var stateData;
  if (componentsObj[selectedMethod] && componentsObj[selectedMethod].stateData) {
    stateData = componentsObj[selectedMethod].stateData;
  } else {
    var type = document.querySelector("#component_".concat(selectedMethod, " .type")) ? document.querySelector("#component_".concat(selectedMethod, " .type")).value : selectedMethod;
    stateData = {
      paymentMethod: {
        type: type
      }
    };
    var brandElm = document.querySelector("#component_".concat(selectedMethod, " .brand"));
    if (brandElm && brandElm.value) {
      stateData.paymentMethod.brand = brandElm.value;
    }
  }
  document.querySelector('#adyenStateData').value = JSON.stringify(stateData);
}

/**
 * Contains fallback components for payment methods that don't have an Adyen web component yet
 */
function getFallback(paymentMethod) {
  var fallback = {
    giftcard: "\n      <input type=\"hidden\" class=\"brand\" name=\"brand\" value=\"".concat(paymentMethod.brand, "\"/>\n      <input type=\"hidden\" class=\"type\" name=\"type\" value=\"").concat(paymentMethod.type, "\"/>")
  };
  return fallback[paymentMethod.type];
}

/**
 * Renders all payment methods (including card component) retrieved from Adyen session
 */
function renderGenericComponent() {
  return _renderGenericComponent.apply(this, arguments);
}
function _renderGenericComponent() {
  _renderGenericComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var amazonpay, i, paymentMethod, firstPaymentMethod;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!Object.keys(componentsObj).length) {
              _context4.next = 3;
              break;
            }
            _context4.next = 3;
            return unmountComponents();
          case 3:
            checkoutConfiguration.paymentMethodsResponse = paymentMethodsResponse.paymentMethods;
            if (sessionsResponse.amount) {
              checkoutConfiguration.amount = sessionsResponse.amount;
              checkoutConfiguration.paymentMethodsConfiguration.paypal.amount = sessionsResponse.amount;
              checkoutConfiguration.paymentMethodsConfiguration.amazonpay.amount = sessionsResponse.amount;
              setInstallments(sessionsResponse.amount);
            }
            if (sessionsResponse.countryCode) {
              checkoutConfiguration.countryCode = sessionsResponse.countryCode;
            }
            amazonpay = paymentMethodsResponse.paymentMethods.find(function (paymentMethod) {
              return paymentMethod.type === 'amazonpay';
            });
            if (amazonpay) {
              checkoutConfiguration.paymentMethodsConfiguration.amazonpay.configuration = amazonpay.configuration;
            }
            if (paymentMethodsResponse.storedPaymentMethods) {
              for (i = 0; i < checkout.paymentMethodsResponse.storedPaymentMethods.length; i++) {
                paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
                if (paymentMethod.supportedShopperInteractions.includes('Ecommerce')) {
                  renderPaymentMethod(paymentMethod, true, sessionsResponse.imagePath);
                }
              }
            }
            paymentMethodsResponse.paymentMethods.forEach(function (pm) {
              renderPaymentMethod(pm, false, sessionsResponse.imagePath);
            });
            firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
            firstPaymentMethod.checked = true;
            displaySelectedMethod(firstPaymentMethod.value);
          case 13:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _renderGenericComponent.apply(this, arguments);
}
function getPaymentMethodID(isStored, paymentMethod) {
  if (isStored) {
    return "storedCard".concat(paymentMethod.id);
  }
  if (paymentMethod.brand) {
    // gift cards all share the same type. Brand is used to differentiate between them
    return "".concat(paymentMethod.type, "_").concat(paymentMethod.brand);
  }
  return paymentMethod.type;
}
function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path) {
  var paymentMethodsUI = document.querySelector('#paymentMethodsList');
  var li = document.createElement('li');
  var paymentMethodID = getPaymentMethodID(storedPaymentMethodBool, paymentMethod);
  var isSchemeNotStored = paymentMethod.type === 'scheme' && !storedPaymentMethodBool;
  var paymentMethodImage = storedPaymentMethodBool ? "".concat(path).concat(paymentMethod.brand, ".png") : "".concat(path).concat(paymentMethod.type, ".png");
  var cardImage = "".concat(path, "card.png");
  var imagePath = isSchemeNotStored ? cardImage : paymentMethodImage;
  var label = storedPaymentMethodBool ? "".concat(paymentMethod.name, " ").concat(MASKED_CC_PREFIX).concat(paymentMethod.lastFour) : "".concat(paymentMethod.name);
  var liContents = "\n                              <input name=\"brandCode\" type=\"radio\" value=\"".concat(paymentMethodID, "\" id=\"rb_").concat(paymentMethodID, "\">\n                              <img class=\"paymentMethod_img\" src=\"").concat(imagePath, "\" ></img>\n                              <label id=\"lb_").concat(paymentMethodID, "\" for=\"rb_").concat(paymentMethodID, "\" style=\"float: none; width: 100%; display: inline; text-align: inherit\">").concat(label, "</label>\n                             ");
  var container = document.createElement('div');
  li.innerHTML = liContents;
  li.classList.add('paymentMethod');
  var node = renderCheckoutComponent(storedPaymentMethodBool, checkout, paymentMethod, container, paymentMethodID);
  container.classList.add('additionalFields');
  container.setAttribute('id', "component_".concat(paymentMethodID));
  container.setAttribute('style', 'display:none');
  li.append(container);
  paymentMethodsUI.append(li);
  if (paymentMethod.type !== 'paywithgoogle') {
    node && node.mount(container);
  } else {
    node.isAvailable().then(function () {
      node.mount(container);
    })["catch"](function () {}); // eslint-disable-line no-empty
  }

  var input = document.querySelector("#rb_".concat(paymentMethodID));
  input.onchange = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(event) {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (document.querySelector('.adyen-checkout__qr-loader') && qrCodeMethods.indexOf(selectedMethod) > -1 || paypalTerminatedEarly) {
                paypalTerminatedEarly = false;
                paymentFromComponent({
                  cancelTransaction: true,
                  merchantReference: document.querySelector('#merchantReference').value
                });
              }
              displaySelectedMethod(event.target.value);
            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  if (paymentMethodID === 'giropay') {
    container.innerHTML = '';
  }
  if (storedPaymentMethodBool && ['bcmc', 'scheme'].indexOf(paymentMethodID) > -1) {
    componentsObj[paymentMethodID].isValid = true;
  }
}
function renderCheckoutComponent(storedPaymentMethodBool, checkout, paymentMethod, container, paymentMethodID) {
  if (storedPaymentMethodBool) {
    return createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID);
  }
  var fallback = getFallback(paymentMethod);
  if (fallback) {
    var template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
    return;
  }
  return createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID);
}
function getPersonalDetails() {
  var shippingAddress = sessionsResponse.shippingAddress;
  return {
    firstName: shippingAddress.firstName,
    lastName: shippingAddress.lastName,
    telephoneNumber: shippingAddress.phone
  };
}
function createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID) {
  try {
    var nodeData = Object.assign(paymentMethod, {
      data: Object.assign(getPersonalDetails(), {
        personalDetails: getPersonalDetails()
      }),
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden'
      }
    });
    var node = checkout.create(paymentMethod.type, nodeData);
    if (!componentsObj[paymentMethodID]) {
      componentsObj[paymentMethodID] = {};
    }
    componentsObj[paymentMethodID].node = node;
    componentsObj[paymentMethodID].isValid = node.isValid;
    return node;
  } catch (e) {} // eslint-disable-line no-empty
  return false;
}

/**
 * Makes an ajax call to the controller function PaymentFromComponent.
 * Used by certain payment methods like paypal
 */
function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: JSON.stringify(data),
    contentType: 'application/; charset=utf-8',
    success: function success(data) {
      if (data.result && data.result.orderNo && data.result.orderToken) {
        document.querySelector('#orderToken').value = data.result.orderToken;
        document.querySelector('#merchantReference').value = data.result.orderNo;
      }
      if (data.result && data.result.fullResponse && data.result.fullResponse.action) {
        component.handleAction(data.result.fullResponse.action);
      } else {
        document.querySelector('#paymentFromComponentStateData').value = JSON.stringify('null');
        $('#dwfrm_billing').trigger('submit');
      }
    }
  }).fail(function /* xhr, textStatus */ () {});
}
$('#dwfrm_billing').submit(function (e) {
  if (['paypal', 'mbway', 'amazonpay'].concat(qrCodeMethods).indexOf(selectedMethod) > -1 && !document.querySelector('#paymentFromComponentStateData').value) {
    e.preventDefault();
    var form = $(this);
    var url = form.attr('action');
    $.ajax({
      type: 'POST',
      url: url,
      data: form.serialize(),
      async: false,
      success: function success(data) {
        formErrorsExist = data.fieldErrors;
      }
    });
  }
});
function getQRCodeConfig() {
  return {
    showPayButton: true,
    onSubmit: function onSubmit(state, component) {
      $('#dwfrm_billing').trigger('submit');
      if (formErrorsExist) {
        return;
      }
      assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(state.data);
      paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: function onAdditionalDetails(state /* , component */) {
      document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(state.data);
      $('#dwfrm_billing').trigger('submit');
    }
  };
}
function getCardConfig() {
  return {
    enableStoreDetails: showStoreDetails,
    showBrandsUnderCardNumber: false,
    onBrand: function onBrand(brandObject) {
      $('#cardType').val(brandObject.brand);
    },
    onFieldValid: function onFieldValid(data) {
      if (data.endDigits) {
        maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
        $('#cardNumber').val(maskedCardNumber);
      }
    },
    onChange: function onChange(state) {
      isValid = state.isValid;
      var methodToUpdate = state.data.paymentMethod.storedPaymentMethodId ? "storedCard".concat(state.data.paymentMethod.storedPaymentMethodId) : selectedMethod;
      $('#browserInfo').val(JSON.stringify(state.data.browserInfo));
      componentsObj[methodToUpdate].isValid = isValid;
      componentsObj[methodToUpdate].stateData = state.data;
    }
  };
}
function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: function onSubmit() {
      assignPaymentMethodValue();
      document.querySelector('#billing-submit').disabled = false;
      document.querySelector('#billing-submit').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount
    },
    showPayButton: true,
    buttonColor: 'white'
  };
}
function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    addressDetails: {
      name: sessionsResponse.shippingAddress.firstName + ' ' + sessionsResponse.shippingAddress.lastName,
      addressLine1: sessionsResponse.shippingAddress.address1,
      city: sessionsResponse.shippingAddress.city,
      stateOrRegion: sessionsResponse.shippingAddress.city,
      postalCode: sessionsResponse.shippingAddress.postalCode,
      countryCode: sessionsResponse.shippingAddress.country,
      phoneNumber: sessionsResponse.shippingAddress.phone
    },
    onClick: function onClick(resolve, reject) {
      $('#dwfrm_billing').trigger('submit');
      if (formErrorsExist) {
        reject();
      } else {
        assignPaymentMethodValue();
        resolve();
      }
    },
    onError: function onError() {}
  };
}
function getInstallmentValues(maxValue) {
  var values = [];
  for (var i = 1; i <= maxValue; i += 1) {
    values.push(i);
  }
  return values;
}
function setInstallments(amount) {
  try {
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    var _ref4 = window.installments ? window.installments.replace(/\[|]/g, '').split(',') : [null, null],
      _ref5 = _slicedToArray(_ref4, 2),
      minAmount = _ref5[0],
      numOfInstallments = _ref5[1];
    if (minAmount <= amount.value) {
      checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions = {
        card: {}
      }; // eslint-disable-next-line max-len
      checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions.card.values = getInstallmentValues(numOfInstallments);
      checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
    }
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */

exports.initBilling = function () {
  initializeBillingEvents();
};
exports.initAccount = function () {
  initializeAccountEvents();
};
exports.renderGenericComponent = function () {
  renderGenericComponent();
};