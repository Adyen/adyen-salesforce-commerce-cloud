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
var helpers = require('./helpers');
var _require = require('./makePartialPayment'),
  makePartialPayment = _require.makePartialPayment;
var _require2 = require('../commons'),
  onBrand = _require2.onBrand,
  onFieldValid = _require2.onFieldValid;
var store = require('../../../../store');
var constants = require('../constants');
var _require3 = require('./renderGiftcardComponent'),
  createElementsToShowRemainingGiftCardAmount = _require3.createElementsToShowRemainingGiftCardAmount,
  renderAddedGiftCard = _require3.renderAddedGiftCard,
  getGiftCardElements = _require3.getGiftCardElements,
  showGiftCardInfoMessage = _require3.showGiftCardInfoMessage,
  showGiftCardCancelButton = _require3.showGiftCardCancelButton,
  attachGiftCardCancelListener = _require3.attachGiftCardCancelListener;
function getCardConfig() {
  return {
    hasHolderName: true,
    holderNameRequired: true,
    enableStoreDetails: window.showStoreDetails,
    showBrandsUnderCardNumber: false,
    clickToPayConfiguration: {
      shopperEmail: window.customerEmail,
      merchantDisplayName: window.merchantAccount
    },
    exposeExpiryDate: false,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      var method = state.data.paymentMethod.storedPaymentMethodId ? "storedCard".concat(state.data.paymentMethod.storedPaymentMethodId) : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
    },
    onSubmit: function onSubmit() {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    onFieldValid: onFieldValid,
    onBrand: onBrand
  };
}
function getPaypalConfig() {
  store.paypalTerminatedEarly = false;
  return {
    showPayButton: true,
    environment: window.Configuration.environment,
    onSubmit: function onSubmit(state, component) {
      helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(store.selectedPayment.stateData);
      helpers.paymentFromComponent(state.data, component);
    },
    onCancel: function onCancel(data, component) {
      store.paypalTerminatedEarly = false;
      helpers.paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value
      }, component);
    },
    onError: function onError(error, component) {
      store.paypalTerminatedEarly = false;
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: function onAdditionalDetails(state) {
      store.paypalTerminatedEarly = false;
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
      document.querySelector('#showConfirmationForm').submit();
    },
    onClick: function onClick(data, actions) {
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return actions.reject();
      }
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }
      store.paypalTerminatedEarly = true;
      return null;
    }
  };
}
function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: function onSubmit() {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount
    },
    showPayButton: true,
    buttonColor: 'white'
  };
}
function handlePartialPaymentSuccess() {
  var _store$addedGiftCards;
  var _getGiftCardElements = getGiftCardElements(),
    giftCardSelectContainer = _getGiftCardElements.giftCardSelectContainer,
    giftCardSelect = _getGiftCardElements.giftCardSelect,
    giftCardsList = _getGiftCardElements.giftCardsList,
    cancelMainPaymentGiftCard = _getGiftCardElements.cancelMainPaymentGiftCard,
    giftCardAddButton = _getGiftCardElements.giftCardAddButton;
  giftCardSelectContainer.classList.add('invisible');
  giftCardSelect.value = null;
  giftCardsList.innerHTML = '';
  cancelMainPaymentGiftCard.addEventListener('click', function () {
    store.componentsObj.giftcard.node.unmount('component_giftcard');
    cancelMainPaymentGiftCard.classList.add('invisible');
    giftCardAddButton.style.display = 'block';
    giftCardSelect.value = 'null';
  });
  if (store.componentsObj.giftcard) {
    store.componentsObj.giftcard.node.unmount('component_giftcard');
  }
  store.addedGiftCards.forEach(function (card) {
    renderAddedGiftCard(card);
  });
  if ((_store$addedGiftCards = store.addedGiftCards) !== null && _store$addedGiftCards !== void 0 && _store$addedGiftCards.length) {
    showGiftCardInfoMessage();
  }
  showGiftCardCancelButton(true);
  attachGiftCardCancelListener();
  createElementsToShowRemainingGiftCardAmount();
}
function makeGiftcardPaymentRequest(_x, _x2, _x3) {
  return _makeGiftcardPaymentRequest.apply(this, arguments);
}
function _makeGiftcardPaymentRequest() {
  _makeGiftcardPaymentRequest = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(paymentMethod, giftcardBalance, reject) {
    var brandSelect, selectedBrandIndex, giftcardBrand, encryptedCardNumber, encryptedSecurityCode, brand, partialPaymentRequest, partialPaymentResponse;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          brandSelect = document.getElementById('giftCardSelect');
          selectedBrandIndex = brandSelect.selectedIndex;
          giftcardBrand = brandSelect.options[selectedBrandIndex].text;
          encryptedCardNumber = paymentMethod.encryptedCardNumber, encryptedSecurityCode = paymentMethod.encryptedSecurityCode, brand = paymentMethod.brand;
          partialPaymentRequest = {
            encryptedCardNumber: encryptedCardNumber,
            encryptedSecurityCode: encryptedSecurityCode,
            brand: brand,
            giftcardBrand: giftcardBrand
          };
          _context2.next = 7;
          return makePartialPayment(partialPaymentRequest);
        case 7:
          partialPaymentResponse = _context2.sent;
          if (partialPaymentResponse !== null && partialPaymentResponse !== void 0 && partialPaymentResponse.error) {
            reject();
          } else {
            handlePartialPaymentSuccess();
          }
        case 9:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _makeGiftcardPaymentRequest.apply(this, arguments);
}
function getGiftCardConfig() {
  var giftcardBalance;
  return {
    showPayButton: true,
    onChange: function onChange(state) {
      store.updateSelectedPayment(constants.GIFTCARD, 'isValid', state.isValid);
      store.updateSelectedPayment(constants.GIFTCARD, 'stateData', state.data);
    },
    onBalanceCheck: function onBalanceCheck(resolve, reject, requestData) {
      var payload = {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestData)
      };
      $.ajax({
        type: 'POST',
        url: window.checkBalanceUrl,
        data: payload,
        async: false,
        success: function success(data) {
          giftcardBalance = data.balance;
          document.querySelector('button[value="submit-payment"]').disabled = false;
          if (data.resultCode === constants.SUCCESS) {
            var _getGiftCardElements2 = getGiftCardElements(),
              giftCardsInfoMessageContainer = _getGiftCardElements2.giftCardsInfoMessageContainer,
              giftCardSelect = _getGiftCardElements2.giftCardSelect,
              cancelMainPaymentGiftCard = _getGiftCardElements2.cancelMainPaymentGiftCard,
              giftCardAddButton = _getGiftCardElements2.giftCardAddButton,
              giftCardSelectWrapper = _getGiftCardElements2.giftCardSelectWrapper;
            if (giftCardSelectWrapper) {
              giftCardSelectWrapper.classList.add('invisible');
            }
            var initialPartialObject = _objectSpread({}, store.partialPaymentsOrderObj);
            cancelMainPaymentGiftCard.classList.remove('invisible');
            cancelMainPaymentGiftCard.addEventListener('click', function () {
              store.componentsObj.giftcard.node.unmount('component_giftcard');
              cancelMainPaymentGiftCard.classList.add('invisible');
              giftCardAddButton.style.display = 'block';
              giftCardSelect.value = 'null';
              store.partialPaymentsOrderObj.remainingAmountFormatted = initialPartialObject.remainingAmountFormatted;
              store.partialPaymentsOrderObj.totalDiscountedAmount = initialPartialObject.totalDiscountedAmount;
            });
            document.querySelector('button[value="submit-payment"]').disabled = true;
            giftCardsInfoMessageContainer.innerHTML = '';
            giftCardsInfoMessageContainer.classList.remove('gift-cards-info-message-container');
            store.partialPaymentsOrderObj.remainingAmountFormatted = data.remainingAmountFormatted;
            store.partialPaymentsOrderObj.totalDiscountedAmount = data.totalAmountFormatted;
            resolve(data);
          } else if (data.resultCode === constants.NOTENOUGHBALANCE && data.balance.value > 0) {
            resolve(data);
          } else {
            reject();
          }
        },
        fail: function fail() {
          reject();
        }
      });
    },
    onOrderRequest: function onOrderRequest(resolve, reject, requestData) {
      // Make a POST /orders request
      // Create an order for the total transaction amount
      var paymentMethod = requestData.paymentMethod;
      if (store.adyenOrderDataCreated) {
        makeGiftcardPaymentRequest(paymentMethod, giftcardBalance, reject);
      } else {
        $.ajax({
          type: 'POST',
          url: window.partialPaymentsOrderUrl,
          data: {
            csrf_token: $('#adyen-token').val(),
            data: JSON.stringify(requestData)
          },
          async: false,
          success: function success(data) {
            if (data.resultCode === 'Success') {
              store.adyenOrderDataCreated = true;
              // make payments call including giftcard data and order data
              makeGiftcardPaymentRequest(paymentMethod, giftcardBalance, reject);
            }
          }
        });
      }
    },
    onSubmit: function onSubmit(state, component) {
      store.selectedMethod = state.data.paymentMethod.type;
      store.brand = component === null || component === void 0 ? void 0 : component.displayName;
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    }
  };
}
function handleOnChange(_x4) {
  return _handleOnChange.apply(this, arguments);
}
function _handleOnChange() {
  _handleOnChange = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(state) {
    var type;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          type = state.data.paymentMethod.type;
          store.isValid = state.isValid;
          if (!store.componentsObj[type]) {
            store.componentsObj[type] = {};
          }
          store.componentsObj[type].isValid = store.isValid;
          store.componentsObj[type].stateData = state.data;
        case 5:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _handleOnChange.apply(this, arguments);
}
var actionHandler = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(action) {
    var checkout;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return AdyenCheckout(store.checkoutConfiguration);
        case 2:
          checkout = _context.sent;
          checkout.createFromAction(action).mount('#action-container');
          $('#action-modal').modal({
            backdrop: 'static',
            keyboard: false
          });
          if (action.type === constants.ACTIONTYPE.QRCODE) {
            document.getElementById('cancelQrMethodsButton').classList.remove('invisible');
          }
        case 6:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function actionHandler(_x5) {
    return _ref.apply(this, arguments);
  };
}();
function handleOnAdditionalDetails(state) {
  var requestData = JSON.stringify({
    data: state.data,
    orderToken: window.orderToken
  });
  $.ajax({
    type: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: requestData
    },
    async: false,
    success: function success(data) {
      if (!data.isFinal && _typeof(data.action) === 'object') {
        actionHandler(data.action);
      } else {
        window.location.href = data.redirectUrl;
      }
    }
  });
}
function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    onClick: function onClick(resolve, reject) {
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        reject();
      } else {
        helpers.assignPaymentMethodValue();
        resolve();
      }
    },
    onError: function onError() {}
  };
}
function getApplePayConfig() {
  return {
    showPayButton: true,
    buttonColor: 'black',
    onSubmit: function onSubmit(state, component) {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    }
  };
}
function getCashAppConfig() {
  return {
    showPayButton: true,
    onSubmit: function onSubmit(state, component) {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    }
  };
}
function getKlarnaConfig() {
  var _window = window,
    klarnaWidgetEnabled = _window.klarnaWidgetEnabled;
  if (klarnaWidgetEnabled) {
    return {
      showPayButton: true,
      useKlarnaWidget: true,
      onError: function onError(component) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
          orderToken: document.querySelector('#orderToken').value
        }, component);
        document.querySelector('#showConfirmationForm').submit();
      },
      onSubmit: function onSubmit(state, component) {
        helpers.assignPaymentMethodValue();
        helpers.paymentFromComponent(state.data, component);
      },
      onAdditionalDetails: function onAdditionalDetails(state) {
        document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      }
    };
  }
  return null;
}
function getUpiConfig() {
  return {
    showPayButton: true,
    onSubmit: function onSubmit(state, component) {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: function onAdditionalDetails(state) {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
      document.querySelector('#showConfirmationForm').submit();
    },
    onError: function onError(component) {
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    }
  };
}
function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;
  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    bcmc: getCardConfig(),
    storedCard: _objectSpread(_objectSpread({}, getCardConfig()), {}, {
      holderNameRequired: false
    }),
    boletobancario: {
      personalDetailsRequired: true,
      // turn personalDetails section on/off
      billingAddressRequired: false,
      // turn billingAddress section on/off
      showEmailAddress: false // allow shopper to specify their email address
    },
    paywithgoogle: getGooglePayConfig(),
    googlepay: getGooglePayConfig(),
    paypal: getPaypalConfig(),
    amazonpay: getAmazonpayConfig(),
    giftcard: getGiftCardConfig(),
    applepay: getApplePayConfig(),
    klarna: getKlarnaConfig(),
    klarna_account: getKlarnaConfig(),
    klarna_paynow: getKlarnaConfig(),
    cashapp: getCashAppConfig(),
    upi: getUpiConfig()
  };
}
module.exports = {
  getCardConfig: getCardConfig,
  getPaypalConfig: getPaypalConfig,
  getGooglePayConfig: getGooglePayConfig,
  getAmazonpayConfig: getAmazonpayConfig,
  getGiftCardConfig: getGiftCardConfig,
  getApplePayConfig: getApplePayConfig,
  getCashAppConfig: getCashAppConfig,
  getKlarnaConfig: getKlarnaConfig,
  setCheckoutConfiguration: setCheckoutConfiguration,
  actionHandler: actionHandler
};