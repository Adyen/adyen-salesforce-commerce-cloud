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
var _require = require('./commons'),
  getPaymentMethods = _require.getPaymentMethods,
  updateLoadedExpressMethods = _require.updateLoadedExpressMethods,
  checkIfExpressMethodsAreReady = _require.checkIfExpressMethodsAreReady;
var helpers = require('./adyen_checkout/helpers');
var _require2 = require('./constants'),
  PAYPAL = _require2.PAYPAL;
function callPaymentFromComponent(_x, _x2) {
  return _callPaymentFromComponent.apply(this, arguments);
}
function _callPaymentFromComponent() {
  _callPaymentFromComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(data, component) {
    var response, _yield$response$json, action, _yield$response$json$, errorMessage;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          $.spinner().start();
          _context6.next = 4;
          return fetch(window.makeExpressPaymentsCall, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
        case 4:
          response = _context6.sent;
          _context6.next = 7;
          return response.json();
        case 7:
          _yield$response$json = _context6.sent;
          action = _yield$response$json.action;
          _yield$response$json$ = _yield$response$json.errorMessage;
          errorMessage = _yield$response$json$ === void 0 ? '' : _yield$response$json$;
          if (!(response.ok && action)) {
            _context6.next = 15;
            break;
          }
          component.handleAction(action);
          _context6.next = 16;
          break;
        case 15:
          throw new Error(errorMessage);
        case 16:
          _context6.next = 21;
          break;
        case 18:
          _context6.prev = 18;
          _context6.t0 = _context6["catch"](0);
          component.handleError();
        case 21:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 18]]);
  }));
  return _callPaymentFromComponent.apply(this, arguments);
}
function saveShopperDetails(_x3, _x4) {
  return _saveShopperDetails.apply(this, arguments);
}
function _saveShopperDetails() {
  _saveShopperDetails = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(details, actions) {
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          return _context7.abrupt("return", $.ajax({
            url: window.saveShopperData,
            type: 'post',
            data: {
              shopperDetails: JSON.stringify(details)
            },
            success: function success() {
              actions.resolve();
            },
            error: function error() {
              $.spinner().stop();
            }
          }));
        case 1:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return _saveShopperDetails.apply(this, arguments);
}
function redirectToReviewPage(data) {
  var redirect = $('<form>').appendTo(document.body).attr({
    method: 'POST',
    action: window.checkoutReview
  });
  $('<input>').appendTo(redirect).attr({
    name: 'data',
    value: JSON.stringify(data)
  });
  redirect.submit();
}
function makeExpressPaymentDetailsCall(data) {
  return $.ajax({
    type: 'POST',
    url: window.makeExpressPaymentDetailsCall,
    data: JSON.stringify({
      data: data
    }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
    },
    error: function error() {
      $.spinner().stop();
    }
  });
}
function updateComponent(_x5, _x6) {
  return _updateComponent.apply(this, arguments);
}
function _updateComponent() {
  _updateComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(response, component) {
    var _yield$response$json2, paymentData, status, _yield$response$json3, errorMessage, _yield$response$json4, _yield$response$json5, _errorMessage;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          if (!response.ok) {
            _context8.next = 13;
            break;
          }
          _context8.next = 3;
          return response.json();
        case 3:
          _yield$response$json2 = _context8.sent;
          paymentData = _yield$response$json2.paymentData;
          status = _yield$response$json2.status;
          _yield$response$json3 = _yield$response$json2.errorMessage;
          errorMessage = _yield$response$json3 === void 0 ? '' : _yield$response$json3;
          if (!(!paymentData || status !== 'success')) {
            _context8.next = 10;
            break;
          }
          throw new Error(errorMessage);
        case 10:
          // Update the Component paymentData value with the new one.
          component.updatePaymentData(paymentData);
          _context8.next = 19;
          break;
        case 13:
          _context8.next = 15;
          return response.json();
        case 15:
          _yield$response$json4 = _context8.sent;
          _yield$response$json5 = _yield$response$json4.errorMessage;
          _errorMessage = _yield$response$json5 === void 0 ? '' : _yield$response$json5;
          throw new Error(_errorMessage);
        case 19:
          return _context8.abrupt("return", false);
        case 20:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return _updateComponent.apply(this, arguments);
}
function handleShippingAddressChange(_x7, _x8, _x9) {
  return _handleShippingAddressChange.apply(this, arguments);
}
function _handleShippingAddressChange() {
  _handleShippingAddressChange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(data, actions, component) {
    var shippingAddress, errors, currentPaymentData, request, response;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          shippingAddress = data.shippingAddress, errors = data.errors;
          currentPaymentData = component.paymentData;
          if (shippingAddress) {
            _context9.next = 5;
            break;
          }
          throw new Error(errors === null || errors === void 0 ? void 0 : errors.ADDRESS_ERROR);
        case 5:
          request = {
            paymentMethodType: PAYPAL,
            currentPaymentData: currentPaymentData,
            address: {
              city: shippingAddress.city,
              country: shippingAddress.country,
              countryCode: shippingAddress.countryCode,
              stateCode: shippingAddress.state,
              postalCode: shippingAddress.postalCode
            }
          };
          _context9.next = 8;
          return fetch(window.shippingMethodsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(request)
          });
        case 8:
          response = _context9.sent;
          _context9.next = 11;
          return updateComponent(response, component);
        case 11:
          _context9.next = 16;
          break;
        case 13:
          _context9.prev = 13;
          _context9.t0 = _context9["catch"](0);
          actions.reject();
        case 16:
          return _context9.abrupt("return", false);
        case 17:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 13]]);
  }));
  return _handleShippingAddressChange.apply(this, arguments);
}
function handleShippingOptionChange(_x10, _x11, _x12) {
  return _handleShippingOptionChange.apply(this, arguments);
}
function _handleShippingOptionChange() {
  _handleShippingOptionChange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(data, actions, component) {
    var selectedShippingOption, errors, currentPaymentData, request, response;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          selectedShippingOption = data.selectedShippingOption, errors = data.errors;
          currentPaymentData = component.paymentData;
          if (selectedShippingOption) {
            _context10.next = 5;
            break;
          }
          throw new Error(errors === null || errors === void 0 ? void 0 : errors.METHOD_UNAVAILABLE);
        case 5:
          request = {
            paymentMethodType: PAYPAL,
            currentPaymentData: currentPaymentData,
            methodID: selectedShippingOption === null || selectedShippingOption === void 0 ? void 0 : selectedShippingOption.id
          };
          _context10.next = 8;
          return fetch(window.selectShippingMethodUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(request)
          });
        case 8:
          response = _context10.sent;
          _context10.next = 11;
          return updateComponent(response, component);
        case 11:
          _context10.next = 16;
          break;
        case 13:
          _context10.prev = 13;
          _context10.t0 = _context10["catch"](0);
          actions.reject();
        case 16:
          return _context10.abrupt("return", false);
        case 17:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 13]]);
  }));
  return _handleShippingOptionChange.apply(this, arguments);
}
function getPaypalButtonConfig(paypalConfig) {
  var _window = window,
    paypalReviewPageEnabled = _window.paypalReviewPageEnabled;
  return _objectSpread(_objectSpread({
    showPayButton: true,
    configuration: paypalConfig,
    returnUrl: window.returnUrl,
    isExpress: true
  }, paypalReviewPageEnabled ? {
    userAction: 'continue'
  } : {}), {}, {
    onSubmit: function () {
      var _onSubmit = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(state, component) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return callPaymentFromComponent(state.data, component);
            case 2:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      function onSubmit(_x13, _x14) {
        return _onSubmit.apply(this, arguments);
      }
      return onSubmit;
    }(),
    onError: function () {
      var _onError = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              $.spinner().stop();
            case 1:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function onError() {
        return _onError.apply(this, arguments);
      }
      return onError;
    }(),
    onShopperDetails: function () {
      var _onShopperDetails = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(shopperDetails, rawData, actions) {
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return saveShopperDetails(shopperDetails, actions);
            case 2:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      function onShopperDetails(_x15, _x16, _x17) {
        return _onShopperDetails.apply(this, arguments);
      }
      return onShopperDetails;
    }(),
    onAdditionalDetails: function onAdditionalDetails(state) {
      if (paypalReviewPageEnabled) {
        redirectToReviewPage(state.data);
      } else {
        makeExpressPaymentDetailsCall(state.data);
        document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      }
    },
    onShippingAddressChange: function () {
      var _onShippingAddressChange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(data, actions, component) {
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return handleShippingAddressChange(data, actions, component);
            case 2:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));
      function onShippingAddressChange(_x18, _x19, _x20) {
        return _onShippingAddressChange.apply(this, arguments);
      }
      return onShippingAddressChange;
    }(),
    onShippingOptionsChange: function () {
      var _onShippingOptionsChange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(data, actions, component) {
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return handleShippingOptionChange(data, actions, component);
            case 2:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));
      function onShippingOptionsChange(_x21, _x22, _x23) {
        return _onShippingOptionsChange.apply(this, arguments);
      }
      return onShippingOptionsChange;
    }()
  });
}
function mountPaypalComponent() {
  return _mountPaypalComponent.apply(this, arguments);
}
function _mountPaypalComponent() {
  _mountPaypalComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
    var _paymentMethodsRespon, paymentMethod, paymentMethodsResponse, applicationInfo, paypalConfig, checkout, paypalButtonConfig, paypalExpressButton;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          _context11.next = 3;
          return getPaymentMethods();
        case 3:
          paymentMethod = _context11.sent;
          paymentMethodsResponse = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.AdyenPaymentMethods;
          applicationInfo = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.applicationInfo;
          paypalConfig = paymentMethodsResponse === null || paymentMethodsResponse === void 0 ? void 0 : (_paymentMethodsRespon = paymentMethodsResponse.paymentMethods.find(function (pm) {
            return pm.type === PAYPAL;
          })) === null || _paymentMethodsRespon === void 0 ? void 0 : _paymentMethodsRespon.configuration;
          if (paypalConfig) {
            _context11.next = 9;
            break;
          }
          return _context11.abrupt("return");
        case 9:
          _context11.next = 11;
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
        case 11:
          checkout = _context11.sent;
          paypalButtonConfig = getPaypalButtonConfig(paypalConfig);
          paypalExpressButton = checkout.create(PAYPAL, paypalButtonConfig);
          paypalExpressButton.mount('#paypal-container');
          updateLoadedExpressMethods(PAYPAL);
          checkIfExpressMethodsAreReady();
          _context11.next = 21;
          break;
        case 19:
          _context11.prev = 19;
          _context11.t0 = _context11["catch"](0);
        case 21:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 19]]);
  }));
  return _mountPaypalComponent.apply(this, arguments);
}
mountPaypalComponent();
module.exports = {
  callPaymentFromComponent: callPaymentFromComponent,
  saveShopperDetails: saveShopperDetails,
  redirectToReviewPage: redirectToReviewPage,
  makeExpressPaymentDetailsCall: makeExpressPaymentDetailsCall,
  updateComponent: updateComponent,
  handleShippingAddressChange: handleShippingAddressChange,
  handleShippingOptionChange: handleShippingOptionChange,
  getPaypalButtonConfig: getPaypalButtonConfig,
  mountPaypalComponent: mountPaypalComponent
};