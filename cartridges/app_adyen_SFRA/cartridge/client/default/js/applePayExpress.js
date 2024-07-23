"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var helpers = require('./adyen_checkout/helpers');
var _require = require('./commons'),
  checkIfExpressMethodsAreReady = _require.checkIfExpressMethodsAreReady;
var _require2 = require('./commons'),
  updateLoadedExpressMethods = _require2.updateLoadedExpressMethods,
  getPaymentMethods = _require2.getPaymentMethods;
var _require3 = require('./constants'),
  APPLE_PAY = _require3.APPLE_PAY;
var checkout;
var shippingMethodsData;
var paymentMethodsResponse;
function formatCustomerObject(customerData, billingData) {
  return {
    addressBook: {
      addresses: {},
      preferredAddress: {
        address1: customerData.addressLines[0],
        address2: customerData.addressLines.length > 1 ? customerData.addressLines[1] : null,
        city: customerData.locality,
        countryCode: {
          displayValue: customerData.country,
          value: customerData.countryCode
        },
        firstName: customerData.givenName,
        lastName: customerData.familyName,
        ID: customerData.emailAddress,
        postalCode: customerData.postalCode,
        stateCode: customerData.administrativeArea
      }
    },
    billingAddressDetails: {
      address1: billingData.addressLines[0],
      address2: billingData.addressLines.length > 1 ? billingData.addressLines[1] : null,
      city: billingData.locality,
      countryCode: {
        displayValue: billingData.country,
        value: billingData.countryCode
      },
      firstName: billingData.givenName,
      lastName: billingData.familyName,
      postalCode: billingData.postalCode,
      stateCode: billingData.administrativeArea
    },
    customer: {},
    profile: {
      firstName: customerData.givenName,
      lastName: customerData.familyName,
      email: customerData.emailAddress,
      phone: customerData.phoneNumber
    }
  };
}
function handleAuthorised(response, resolveApplePay) {
  var _response$fullRespons, _response$fullRespons2, _response$fullRespons3, _response$fullRespons4, _response$fullRespons5, _response$fullRespons6, _response$fullRespons7;
  resolveApplePay();
  document.querySelector('#result').value = JSON.stringify({
    pspReference: (_response$fullRespons = response.fullResponse) === null || _response$fullRespons === void 0 ? void 0 : _response$fullRespons.pspReference,
    resultCode: (_response$fullRespons2 = response.fullResponse) === null || _response$fullRespons2 === void 0 ? void 0 : _response$fullRespons2.resultCode,
    paymentMethod: (_response$fullRespons3 = response.fullResponse) !== null && _response$fullRespons3 !== void 0 && _response$fullRespons3.paymentMethod ? response.fullResponse.paymentMethod : (_response$fullRespons4 = response.fullResponse) === null || _response$fullRespons4 === void 0 ? void 0 : (_response$fullRespons5 = _response$fullRespons4.additionalData) === null || _response$fullRespons5 === void 0 ? void 0 : _response$fullRespons5.paymentMethod,
    donationToken: (_response$fullRespons6 = response.fullResponse) === null || _response$fullRespons6 === void 0 ? void 0 : _response$fullRespons6.donationToken,
    amount: (_response$fullRespons7 = response.fullResponse) === null || _response$fullRespons7 === void 0 ? void 0 : _response$fullRespons7.amount
  });
  document.querySelector('#showConfirmationForm').submit();
}
function handleError(rejectApplePay) {
  rejectApplePay();
  document.querySelector('#result').value = JSON.stringify({
    error: true
  });
  document.querySelector('#showConfirmationForm').submit();
}
function handleApplePayResponse(response, resolveApplePay, rejectApplePay) {
  if (response.resultCode === 'Authorised') {
    handleAuthorised(response, resolveApplePay);
  } else {
    handleError(rejectApplePay);
  }
}
function callPaymentFromComponent(data, resolveApplePay, rejectApplePay) {
  return $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: APPLE_PAY
    },
    success: function success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(data);
      handleApplePayResponse(response, resolveApplePay, rejectApplePay);
    }
  }).fail(function () {
    rejectApplePay();
  });
}
function selectShippingMethod(_ref) {
  var shipmentUUID = _ref.shipmentUUID,
    ID = _ref.ID;
  var request = {
    paymentMethodType: APPLE_PAY,
    shipmentUUID: shipmentUUID,
    methodID: ID
  };
  return fetch(window.selectShippingMethodUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(request)
  });
}
function getShippingMethod(shippingContact) {
  var request = {
    paymentMethodType: APPLE_PAY
  };
  if (shippingContact) {
    request.address = {
      city: shippingContact.locality,
      country: shippingContact.country,
      countryCode: shippingContact.countryCode,
      stateCode: shippingContact.administrativeArea,
      postalCode: shippingContact.postalCode
    };
  }
  return fetch(window.shippingMethodsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(request)
  });
}
function initializeCheckout() {
  return _initializeCheckout.apply(this, arguments);
}
function _initializeCheckout() {
  _initializeCheckout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    var _paymentMethodsRespon3;
    var shippingMethods, applicationInfo;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return getPaymentMethods();
        case 2:
          paymentMethodsResponse = _context5.sent;
          _context5.next = 5;
          return getShippingMethod();
        case 5:
          shippingMethods = _context5.sent;
          _context5.next = 8;
          return shippingMethods.json();
        case 8:
          shippingMethodsData = _context5.sent;
          applicationInfo = (_paymentMethodsRespon3 = paymentMethodsResponse) === null || _paymentMethodsRespon3 === void 0 ? void 0 : _paymentMethodsRespon3.applicationInfo;
          _context5.next = 12;
          return AdyenCheckout({
            environment: window.environment,
            clientKey: window.clientKey,
            locale: window.locale,
            analytics: {
              analyticsData: {
                applicationInfo: applicationInfo
              }
            }
          });
        case 12:
          checkout = _context5.sent;
        case 13:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return _initializeCheckout.apply(this, arguments);
}
function createApplePayButton(_x) {
  return _createApplePayButton.apply(this, arguments);
}
function _createApplePayButton() {
  _createApplePayButton = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(applePayButtonConfig) {
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          return _context6.abrupt("return", checkout.create(APPLE_PAY, applePayButtonConfig));
        case 1:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return _createApplePayButton.apply(this, arguments);
}
initializeCheckout().then( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
  var _paymentMethodsRespon, _paymentMethodsRespon2;
  var applePayPaymentMethod, applePayConfig, applePayButtonConfig, cartContainer, applePayButton, isApplePayButtonAvailable, expressCheckoutNodesIndex;
  return _regeneratorRuntime().wrap(function _callee4$(_context4) {
    while (1) switch (_context4.prev = _context4.next) {
      case 0:
        applePayPaymentMethod = (_paymentMethodsRespon = paymentMethodsResponse) === null || _paymentMethodsRespon === void 0 ? void 0 : (_paymentMethodsRespon2 = _paymentMethodsRespon.AdyenPaymentMethods) === null || _paymentMethodsRespon2 === void 0 ? void 0 : _paymentMethodsRespon2.paymentMethods.find(function (pm) {
          return pm.type === APPLE_PAY;
        });
        if (applePayPaymentMethod) {
          _context4.next = 5;
          break;
        }
        updateLoadedExpressMethods(APPLE_PAY);
        checkIfExpressMethodsAreReady();
        return _context4.abrupt("return");
      case 5:
        applePayConfig = applePayPaymentMethod.configuration;
        applePayButtonConfig = {
          showPayButton: true,
          isExpress: true,
          configuration: applePayConfig,
          amount: JSON.parse(window.basketAmount),
          requiredShippingContactFields: ['postalAddress', 'email', 'phone'],
          requiredBillingContactFields: ['postalAddress', 'phone'],
          shippingMethods: shippingMethodsData.shippingMethods.map(function (sm) {
            return {
              label: sm.displayName,
              detail: sm.description,
              identifier: sm.ID,
              amount: "".concat(sm.shippingCost.value)
            };
          }),
          onAuthorized: function () {
            var _onAuthorized = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(resolve, reject, event) {
              var customerData, billingData, customer, stateData, resolveApplePay;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    customerData = event.payment.shippingContact;
                    billingData = event.payment.billingContact;
                    customer = formatCustomerObject(customerData, billingData);
                    stateData = {
                      paymentMethod: {
                        type: APPLE_PAY,
                        applePayToken: event.payment.token.paymentData
                      },
                      paymentType: 'express'
                    };
                    resolveApplePay = function resolveApplePay() {
                      // ** is used instead of Math.pow
                      var value = applePayButtonConfig.amount.value * Math.pow(10, parseInt(window.digitsNumber, 10));
                      var finalPriceUpdate = {
                        newTotal: {
                          type: 'final',
                          label: applePayConfig.merchantName,
                          amount: "".concat(Math.round(value))
                        }
                      };
                      resolve(finalPriceUpdate);
                    };
                    _context.next = 8;
                    return callPaymentFromComponent(_objectSpread(_objectSpread({}, stateData), {}, {
                      customer: customer
                    }), resolveApplePay, reject);
                  case 8:
                    _context.next = 13;
                    break;
                  case 10:
                    _context.prev = 10;
                    _context.t0 = _context["catch"](0);
                    reject(_context.t0);
                  case 13:
                  case "end":
                    return _context.stop();
                }
              }, _callee, null, [[0, 10]]);
            }));
            function onAuthorized(_x2, _x3, _x4) {
              return _onAuthorized.apply(this, arguments);
            }
            return onAuthorized;
          }(),
          onSubmit: function onSubmit() {
            // This handler is empty to prevent sending a second payment request
            // We already do the payment in paymentFromComponent
          },
          onShippingMethodSelected: function () {
            var _onShippingMethodSelected = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(resolve, reject, event) {
              var shippingMethod, matchingShippingMethod, calculationResponse, newCalculation, applePayShippingMethodUpdate;
              return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    shippingMethod = event.shippingMethod;
                    matchingShippingMethod = shippingMethodsData.shippingMethods.find(function (sm) {
                      return sm.ID === shippingMethod.identifier;
                    });
                    _context2.next = 4;
                    return selectShippingMethod(matchingShippingMethod);
                  case 4:
                    calculationResponse = _context2.sent;
                    if (!calculationResponse.ok) {
                      _context2.next = 14;
                      break;
                    }
                    _context2.next = 8;
                    return calculationResponse.json();
                  case 8:
                    newCalculation = _context2.sent;
                    applePayButtonConfig.amount = {
                      value: newCalculation.grandTotalAmount.value,
                      currency: newCalculation.grandTotalAmount.currency
                    };
                    applePayShippingMethodUpdate = {
                      newTotal: {
                        type: 'final',
                        label: applePayConfig.merchantName,
                        amount: newCalculation.grandTotalAmount.value
                      }
                    };
                    resolve(applePayShippingMethodUpdate);
                    _context2.next = 15;
                    break;
                  case 14:
                    reject();
                  case 15:
                  case "end":
                    return _context2.stop();
                }
              }, _callee2);
            }));
            function onShippingMethodSelected(_x5, _x6, _x7) {
              return _onShippingMethodSelected.apply(this, arguments);
            }
            return onShippingMethodSelected;
          }(),
          onShippingContactSelected: function () {
            var _onShippingContactSelected = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(resolve, reject, event) {
              var shippingContact, shippingMethods, _shippingMethodsData$, selectedShippingMethod, calculationResponse, shippingMethodsStructured, newCalculation, applePayShippingContactUpdate;
              return _regeneratorRuntime().wrap(function _callee3$(_context3) {
                while (1) switch (_context3.prev = _context3.next) {
                  case 0:
                    shippingContact = event.shippingContact;
                    _context3.next = 3;
                    return getShippingMethod(shippingContact);
                  case 3:
                    shippingMethods = _context3.sent;
                    if (!shippingMethods.ok) {
                      _context3.next = 28;
                      break;
                    }
                    _context3.next = 7;
                    return shippingMethods.json();
                  case 7:
                    shippingMethodsData = _context3.sent;
                    if (!((_shippingMethodsData$ = shippingMethodsData.shippingMethods) !== null && _shippingMethodsData$ !== void 0 && _shippingMethodsData$.length)) {
                      _context3.next = 25;
                      break;
                    }
                    selectedShippingMethod = shippingMethodsData.shippingMethods[0];
                    _context3.next = 12;
                    return selectShippingMethod(selectedShippingMethod);
                  case 12:
                    calculationResponse = _context3.sent;
                    if (!calculationResponse.ok) {
                      _context3.next = 22;
                      break;
                    }
                    shippingMethodsStructured = shippingMethodsData.shippingMethods.map(function (sm) {
                      return {
                        label: sm.displayName,
                        detail: sm.description,
                        identifier: sm.ID,
                        amount: "".concat(sm.shippingCost.value)
                      };
                    });
                    _context3.next = 17;
                    return calculationResponse.json();
                  case 17:
                    newCalculation = _context3.sent;
                    applePayShippingContactUpdate = {
                      newShippingMethods: shippingMethodsStructured,
                      newTotal: {
                        type: 'final',
                        label: applePayConfig.merchantName,
                        amount: newCalculation.grandTotalAmount.value
                      }
                    };
                    resolve(applePayShippingContactUpdate);
                    _context3.next = 23;
                    break;
                  case 22:
                    reject();
                  case 23:
                    _context3.next = 26;
                    break;
                  case 25:
                    reject();
                  case 26:
                    _context3.next = 29;
                    break;
                  case 28:
                    reject();
                  case 29:
                  case "end":
                    return _context3.stop();
                }
              }, _callee3);
            }));
            function onShippingContactSelected(_x8, _x9, _x10) {
              return _onShippingContactSelected.apply(this, arguments);
            }
            return onShippingContactSelected;
          }()
        };
        cartContainer = document.getElementsByClassName(APPLE_PAY);
        _context4.next = 10;
        return createApplePayButton(applePayButtonConfig);
      case 10:
        applePayButton = _context4.sent;
        _context4.next = 13;
        return applePayButton.isAvailable();
      case 13:
        isApplePayButtonAvailable = _context4.sent;
        if (isApplePayButtonAvailable) {
          for (expressCheckoutNodesIndex = 0; expressCheckoutNodesIndex < cartContainer.length; expressCheckoutNodesIndex += 1) {
            applePayButton.mount(cartContainer[expressCheckoutNodesIndex]);
          }
        }
        updateLoadedExpressMethods(APPLE_PAY);
        checkIfExpressMethodsAreReady();
      case 17:
      case "end":
        return _context4.stop();
    }
  }, _callee4);
})))["catch"](function () {
  updateLoadedExpressMethods(APPLE_PAY);
  checkIfExpressMethodsAreReady();
});
module.exports = {
  handleAuthorised: handleAuthorised,
  handleError: handleError,
  handleApplePayResponse: handleApplePayResponse,
  callPaymentFromComponent: callPaymentFromComponent,
  formatCustomerObject: formatCustomerObject
};