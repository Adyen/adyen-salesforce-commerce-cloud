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
  checkIfExpressMethodsAreReady = _require.checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods = _require.updateLoadedExpressMethods,
  createTemporaryBasket = _require.createTemporaryBasket;
var _require2 = require('./constants'),
  GOOGLE_PAY = _require2.GOOGLE_PAY,
  PAY_WITH_GOOGLE = _require2.PAY_WITH_GOOGLE,
  GOOGLE_PAY_CALLBACK_TRIGGERS = _require2.GOOGLE_PAY_CALLBACK_TRIGGERS;
var checkout;
var googlePayButton;
function formatCustomerObject(customerData) {
  var shippingData = customerData.shippingAddress;
  var billingData = customerData.paymentMethodData.info.billingAddress;
  var nameParts = customerData.shippingAddress.name.split(' ');
  var firstName = nameParts[0];
  var lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''; // Join the rest
  return {
    addressBook: {
      addresses: {},
      preferredAddress: {
        address1: shippingData.address1,
        address2: shippingData.address2 ? shippingData.address2 : null,
        city: shippingData.locality,
        countryCode: {
          displayValue: shippingData.countryCode,
          value: shippingData.countryCode
        },
        firstName: firstName,
        lastName: lastName,
        ID: customerData.email,
        postalCode: shippingData.postalCode,
        stateCode: shippingData.administrativeArea
      }
    },
    billingAddressDetails: {
      address1: billingData.address1,
      address2: billingData.address2 ? billingData.address2 : null,
      city: billingData.locality,
      countryCode: {
        displayValue: billingData.countryCode,
        value: billingData.countryCode
      },
      firstName: firstName,
      lastName: lastName,
      postalCode: billingData.postalCode,
      stateCode: billingData.administrativeArea
    },
    customer: {},
    profile: {
      firstName: firstName,
      lastName: lastName,
      email: customerData.email,
      phone: shippingData.phoneNumber
    }
  };
}
function getShippingMethods(_x) {
  return _getShippingMethods.apply(this, arguments);
}
function _getShippingMethods() {
  _getShippingMethods = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(shippingAddress) {
    var requestBody;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          requestBody = {
            paymentMethodType: GOOGLE_PAY,
            isExpressPdp: window.isExpressPdp
          };
          if (shippingAddress) {
            requestBody.address = {
              city: shippingAddress.locality,
              country: shippingAddress.country,
              countryCode: shippingAddress.countryCode,
              stateCode: shippingAddress.administrativeArea,
              postalCode: shippingAddress.postalCode
            };
          }
          return _context.abrupt("return", $.ajax({
            type: 'POST',
            url: window.shippingMethodsUrl,
            data: {
              csrf_token: $('#adyen-token').val(),
              data: JSON.stringify(requestBody)
            },
            success: function success(response) {
              return response;
            }
          }));
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _getShippingMethods.apply(this, arguments);
}
function selectShippingMethod(_x2) {
  return _selectShippingMethod.apply(this, arguments);
}
function _selectShippingMethod() {
  _selectShippingMethod = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(_ref) {
    var shipmentUUID, ID, requestBody;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          shipmentUUID = _ref.shipmentUUID, ID = _ref.ID;
          requestBody = {
            paymentMethodType: GOOGLE_PAY,
            shipmentUUID: shipmentUUID,
            methodID: ID,
            isExpressPdp: window.isExpressPdp
          };
          return _context2.abrupt("return", $.ajax({
            type: 'POST',
            url: window.selectShippingMethodUrl,
            data: {
              csrf_token: $('#adyen-token').val(),
              data: JSON.stringify(requestBody)
            },
            success: function success(response) {
              return response;
            }
          }));
        case 3:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _selectShippingMethod.apply(this, arguments);
}
function getTransactionInfo(newCalculation) {
  var _newCalculation$local, _newCalculation$grand, _newCalculation$grand2;
  return {
    countryCode: newCalculation === null || newCalculation === void 0 ? void 0 : (_newCalculation$local = newCalculation.locale) === null || _newCalculation$local === void 0 ? void 0 : _newCalculation$local.slice(-2),
    currencyCode: newCalculation === null || newCalculation === void 0 ? void 0 : (_newCalculation$grand = newCalculation.grandTotalAmount) === null || _newCalculation$grand === void 0 ? void 0 : _newCalculation$grand.currency,
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: "".concat(newCalculation === null || newCalculation === void 0 ? void 0 : (_newCalculation$grand2 = newCalculation.grandTotalAmount) === null || _newCalculation$grand2 === void 0 ? void 0 : _newCalculation$grand2.value)
  };
}
function getShippingOptionsParameters(selectedShippingMethod, shippingMethodsData) {
  return {
    defaultSelectedOptionId: selectedShippingMethod.ID,
    shippingOptions: shippingMethodsData.shippingMethods.map(function (sm) {
      return {
        label: sm.displayName,
        description: sm.description,
        id: sm.ID
      };
    })
  };
}
function handleAuthorised(response) {
  var _document$querySelect, _$;
  if (document.querySelector('#result')) {
    var _response$fullRespons, _response$fullRespons2, _response$fullRespons3, _response$fullRespons4, _response$fullRespons5, _response$fullRespons6, _response$fullRespons7;
    document.querySelector('#result').value = JSON.stringify({
      pspReference: (_response$fullRespons = response.fullResponse) === null || _response$fullRespons === void 0 ? void 0 : _response$fullRespons.pspReference,
      resultCode: (_response$fullRespons2 = response.fullResponse) === null || _response$fullRespons2 === void 0 ? void 0 : _response$fullRespons2.resultCode,
      paymentMethod: (_response$fullRespons3 = response.fullResponse) !== null && _response$fullRespons3 !== void 0 && _response$fullRespons3.paymentMethod ? response.fullResponse.paymentMethod : (_response$fullRespons4 = response.fullResponse) === null || _response$fullRespons4 === void 0 ? void 0 : (_response$fullRespons5 = _response$fullRespons4.additionalData) === null || _response$fullRespons5 === void 0 ? void 0 : _response$fullRespons5.paymentMethod,
      donationToken: (_response$fullRespons6 = response.fullResponse) === null || _response$fullRespons6 === void 0 ? void 0 : _response$fullRespons6.donationToken,
      amount: (_response$fullRespons7 = response.fullResponse) === null || _response$fullRespons7 === void 0 ? void 0 : _response$fullRespons7.amount
    });
  }
  (_document$querySelect = document.querySelector('#showConfirmationForm')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.submit();
  if ((_$ = $) !== null && _$ !== void 0 && _$.spinner) {
    var _$$spinner;
    (_$$spinner = $.spinner()) === null || _$$spinner === void 0 ? void 0 : _$$spinner.stop();
  }
}
function handleError() {
  var _document$querySelect2, _$2;
  if (document.querySelector('#result')) {
    document.querySelector('#result').value = JSON.stringify({
      error: true
    });
  }
  (_document$querySelect2 = document.querySelector('#showConfirmationForm')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.submit();
  if ((_$2 = $) !== null && _$2 !== void 0 && _$2.spinner) {
    var spinnerFn = $.spinner();
    if (spinnerFn.stop) {
      var _$$spinner2;
      (_$$spinner2 = $.spinner()) === null || _$$spinner2 === void 0 ? void 0 : _$$spinner2.stop();
    }
  }
}
function handleGooglePayResponse(response) {
  if (response.resultCode === 'Authorised') {
    handleAuthorised(response);
  } else {
    handleError();
  }
}
function paymentFromComponent(data) {
  $.spinner().start();
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(data),
      paymentMethod: GOOGLE_PAY
    },
    success: function success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(_objectSpread(_objectSpread({}, data), response));
      handleGooglePayResponse(response);
    }
  });
}
function initializeCheckout(_x3) {
  return _initializeCheckout.apply(this, arguments);
}
function _initializeCheckout() {
  _initializeCheckout = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(paymentMethodsResponse) {
    var applicationInfo;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          applicationInfo = paymentMethodsResponse === null || paymentMethodsResponse === void 0 ? void 0 : paymentMethodsResponse.applicationInfo;
          _context3.next = 3;
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
        case 3:
          checkout = _context3.sent;
        case 4:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _initializeCheckout.apply(this, arguments);
}
function onShippingAddressChange(_x4) {
  return _onShippingAddressChange.apply(this, arguments);
}
function _onShippingAddressChange() {
  _onShippingAddressChange = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(shippingAddress) {
    var _shippingMethodsData$;
    var shippingMethodsData, selectedShippingMethod, newCalculation;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return getShippingMethods(shippingAddress);
        case 2:
          shippingMethodsData = _context4.sent;
          if (!(shippingMethodsData !== null && shippingMethodsData !== void 0 && (_shippingMethodsData$ = shippingMethodsData.shippingMethods) !== null && _shippingMethodsData$ !== void 0 && _shippingMethodsData$.length)) {
            _context4.next = 10;
            break;
          }
          selectedShippingMethod = shippingMethodsData.shippingMethods[0];
          _context4.next = 7;
          return selectShippingMethod(selectedShippingMethod);
        case 7:
          newCalculation = _context4.sent;
          if (!(newCalculation !== null && newCalculation !== void 0 && newCalculation.grandTotalAmount)) {
            _context4.next = 10;
            break;
          }
          return _context4.abrupt("return", {
            newShippingOptionParameters: getShippingOptionsParameters(selectedShippingMethod, shippingMethodsData),
            newTransactionInfo: getTransactionInfo(newCalculation, shippingMethodsData)
          });
        case 10:
          return _context4.abrupt("return", {
            error: {
              reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
              message: 'Cannot ship to the selected address',
              intent: 'SHIPPING_ADDRESS'
            }
          });
        case 11:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _onShippingAddressChange.apply(this, arguments);
}
function onShippingOptionChange(_x5, _x6) {
  return _onShippingOptionChange.apply(this, arguments);
}
function _onShippingOptionChange() {
  _onShippingOptionChange = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(shippingAddress, shippingOptionData) {
    var shippingMethodsData, shippingMethods, matchingShippingMethod, newCalculation;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return getShippingMethods(shippingAddress);
        case 2:
          shippingMethodsData = _context5.sent;
          shippingMethods = shippingMethodsData === null || shippingMethodsData === void 0 ? void 0 : shippingMethodsData.shippingMethods;
          matchingShippingMethod = shippingMethods.find(function (sm) {
            return sm.ID === shippingOptionData.id;
          });
          _context5.next = 7;
          return selectShippingMethod(matchingShippingMethod);
        case 7:
          newCalculation = _context5.sent;
          if (!(newCalculation !== null && newCalculation !== void 0 && newCalculation.grandTotalAmount)) {
            _context5.next = 10;
            break;
          }
          return _context5.abrupt("return", {
            newTransactionInfo: getTransactionInfo(newCalculation, shippingMethodsData)
          });
        case 10:
          return _context5.abrupt("return", {
            error: {
              reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
              message: 'Cannot ship to the selected address',
              intent: 'SHIPPING_OPTION'
            }
          });
        case 11:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return _onShippingOptionChange.apply(this, arguments);
}
function init(_x7, _x8) {
  return _init.apply(this, arguments);
}
function _init() {
  _init = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(paymentMethodsResponse, isExpressPdp) {
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          window.isExpressPdp = isExpressPdp;
          initializeCheckout(paymentMethodsResponse).then(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
            var _paymentMethodsRespon;
            var googlePayPaymentMethod, googlePayConfig, googlePayButtonConfig;
            return _regeneratorRuntime().wrap(function _callee9$(_context9) {
              while (1) switch (_context9.prev = _context9.next) {
                case 0:
                  googlePayPaymentMethod = paymentMethodsResponse === null || paymentMethodsResponse === void 0 ? void 0 : (_paymentMethodsRespon = paymentMethodsResponse.AdyenPaymentMethods) === null || _paymentMethodsRespon === void 0 ? void 0 : _paymentMethodsRespon.paymentMethods.find(function (pm) {
                    return pm.type === GOOGLE_PAY || pm.type === PAY_WITH_GOOGLE;
                  });
                  if (googlePayPaymentMethod) {
                    _context9.next = 5;
                    break;
                  }
                  updateLoadedExpressMethods(GOOGLE_PAY);
                  checkIfExpressMethodsAreReady();
                  return _context9.abrupt("return");
                case 5:
                  googlePayConfig = googlePayPaymentMethod.configuration;
                  googlePayButtonConfig = {
                    showPayButton: true,
                    buttonType: 'buy',
                    environment: window.environment,
                    emailRequired: true,
                    shippingAddressRequired: true,
                    shippingOptionRequired: true,
                    shippingAddressParameters: {
                      phoneNumberRequired: true
                    },
                    billingAddressRequired: true,
                    billingAddressParameters: {
                      format: 'FULL',
                      phoneNumberRequired: true
                    },
                    gatewayMerchantId: window.merchantAccount,
                    configuration: googlePayConfig,
                    callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
                    amount: JSON.parse(window.basketAmount),
                    onAuthorized: function () {
                      var _onAuthorized = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(data) {
                        var componentData, customer, requestData;
                        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
                          while (1) switch (_context6.prev = _context6.next) {
                            case 0:
                              componentData = googlePayButton.data;
                              customer = formatCustomerObject(data);
                              requestData = {
                                paymentMethod: {
                                  type: GOOGLE_PAY,
                                  googlePayToken: componentData.paymentMethod.googlePayToken
                                },
                                paymentType: 'express',
                                customer: customer,
                                isExpressPdp: window.isExpressPdp
                              };
                              paymentFromComponent(requestData);
                            case 4:
                            case "end":
                              return _context6.stop();
                          }
                        }, _callee6);
                      }));
                      function onAuthorized(_x9) {
                        return _onAuthorized.apply(this, arguments);
                      }
                      return onAuthorized;
                    }(),
                    onSubmit: function () {
                      var _onSubmit = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
                        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
                          while (1) switch (_context7.prev = _context7.next) {
                            case 0:
                            case "end":
                              return _context7.stop();
                          }
                        }, _callee7);
                      }));
                      function onSubmit() {
                        return _onSubmit.apply(this, arguments);
                      }
                      return onSubmit;
                    }(),
                    paymentDataCallbacks: {
                      onPaymentDataChanged: function onPaymentDataChanged(intermediatePaymentData) {
                        return _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
                          var callbackTrigger, shippingAddress, shippingOptionData, paymentDataRequestUpdate;
                          return _regeneratorRuntime().wrap(function _callee8$(_context8) {
                            while (1) switch (_context8.prev = _context8.next) {
                              case 0:
                                callbackTrigger = intermediatePaymentData.callbackTrigger, shippingAddress = intermediatePaymentData.shippingAddress, shippingOptionData = intermediatePaymentData.shippingOptionData;
                                paymentDataRequestUpdate = {};
                                if (!(callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.INITIALIZE)) {
                                  _context8.next = 9;
                                  break;
                                }
                                if (!window.isExpressPdp) {
                                  _context8.next = 6;
                                  break;
                                }
                                _context8.next = 6;
                                return createTemporaryBasket();
                              case 6:
                                _context8.next = 8;
                                return onShippingAddressChange(shippingAddress);
                              case 8:
                                paymentDataRequestUpdate = _context8.sent;
                              case 9:
                                if (!(callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_ADDRESS)) {
                                  _context8.next = 13;
                                  break;
                                }
                                _context8.next = 12;
                                return onShippingAddressChange(shippingAddress);
                              case 12:
                                paymentDataRequestUpdate = _context8.sent;
                              case 13:
                                if (!(callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_OPTION)) {
                                  _context8.next = 17;
                                  break;
                                }
                                _context8.next = 16;
                                return onShippingOptionChange(shippingAddress, shippingOptionData);
                              case 16:
                                paymentDataRequestUpdate = _context8.sent;
                              case 17:
                                return _context8.abrupt("return", new Promise(function (resolve) {
                                  resolve(paymentDataRequestUpdate);
                                }));
                              case 18:
                              case "end":
                                return _context8.stop();
                            }
                          }, _callee8);
                        }))();
                      }
                    }
                  };
                  googlePayButton = checkout.create(GOOGLE_PAY, googlePayButtonConfig);
                  googlePayButton.mount('.googlepay');
                  updateLoadedExpressMethods(GOOGLE_PAY);
                  checkIfExpressMethodsAreReady();
                case 11:
                case "end":
                  return _context9.stop();
              }
            }, _callee9);
          })))["catch"](function () {
            updateLoadedExpressMethods(GOOGLE_PAY);
            checkIfExpressMethodsAreReady();
          });
        case 2:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return _init.apply(this, arguments);
}
module.exports = {
  init: init,
  formatCustomerObject: formatCustomerObject,
  getTransactionInfo: getTransactionInfo,
  getShippingOptionsParameters: getShippingOptionsParameters,
  onShippingAddressChange: onShippingAddressChange,
  onShippingOptionChange: onShippingOptionChange,
  getShippingMethods: getShippingMethods,
  selectShippingMethod: selectShippingMethod,
  handleAuthorised: handleAuthorised,
  handleError: handleError,
  paymentFromComponent: paymentFromComponent
};