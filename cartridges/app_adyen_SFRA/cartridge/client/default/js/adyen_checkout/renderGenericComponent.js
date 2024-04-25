"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initializeCheckout = initializeCheckout;
var _document$getElementB;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* eslint-disable no-unsafe-optional-chaining */
var store = require('../../../../store');
var _require = require('./renderPaymentMethod'),
  renderPaymentMethod = _require.renderPaymentMethod;
var helpers = require('./helpers');
var _require2 = require('./localesUsingInstallments'),
  installmentLocales = _require2.installmentLocales;
var _require3 = require('../commons'),
  getPaymentMethods = _require3.getPaymentMethods,
  fetchGiftCards = _require3.fetchGiftCards;
var constants = require('../constants');
var _require4 = require('./renderGiftcardComponent'),
  createElementsToShowRemainingGiftCardAmount = _require4.createElementsToShowRemainingGiftCardAmount,
  removeGiftCards = _require4.removeGiftCards,
  renderAddedGiftCard = _require4.renderAddedGiftCard,
  showGiftCardWarningMessage = _require4.showGiftCardWarningMessage,
  attachGiftCardAddButtonListener = _require4.attachGiftCardAddButtonListener,
  showGiftCardInfoMessage = _require4.showGiftCardInfoMessage,
  giftCardBrands = _require4.giftCardBrands,
  clearGiftCardsContainer = _require4.clearGiftCardsContainer,
  attachGiftCardCancelListener = _require4.attachGiftCardCancelListener,
  showGiftCardCancelButton = _require4.showGiftCardCancelButton;
var INIT_CHECKOUT_EVENT = 'INIT_CHECKOUT_EVENT';
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
function setCheckoutConfiguration(checkoutOptions) {
  var setField = function setField(key, val) {
    return val && _defineProperty({}, key, val);
  };
  store.checkoutConfiguration = _objectSpread(_objectSpread(_objectSpread({}, store.checkoutConfiguration), setField('amount', checkoutOptions.amount)), setField('countryCode', checkoutOptions.countryCode));
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
  var promises = Object.entries(store.componentsObj).map(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      key = _ref3[0],
      val = _ref3[1];
    delete store.componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}
function isCartModified(amount, orderAmount) {
  return amount.currency !== orderAmount.currency || amount.value !== orderAmount.value;
}
function renderGiftCardLogo(imagePath) {
  var headingImg = document.querySelector('#headingImg');
  if (headingImg) {
    headingImg.src = "".concat(imagePath, "genericgiftcard.png");
  }
}
function applyGiftCards() {
  var now = new Date().toISOString();
  var amount = store.checkoutConfiguration.amount;
  var orderAmount = store.partialPaymentsOrderObj.orderAmount;
  var isPartialPaymentExpired = store.addedGiftCards.some(function (cart) {
    return now > cart.expiresAt;
  });
  var cartModified = isCartModified(amount, orderAmount);
  if (isPartialPaymentExpired) {
    removeGiftCards();
  } else if (cartModified) {
    removeGiftCards();
    showGiftCardWarningMessage();
  } else {
    var _store$addedGiftCards;
    clearGiftCardsContainer();
    store.addedGiftCards.forEach(function (card) {
      renderAddedGiftCard(card);
    });
    if ((_store$addedGiftCards = store.addedGiftCards) !== null && _store$addedGiftCards !== void 0 && _store$addedGiftCards.length) {
      showGiftCardInfoMessage();
    }
    store.checkout.options.amount = store.addedGiftCards[store.addedGiftCards.length - 1].remainingAmount;
    showGiftCardCancelButton(true);
    attachGiftCardCancelListener();
    createElementsToShowRemainingGiftCardAmount();
  }
}
function renderStoredPaymentMethod(imagePath) {
  return function (pm) {
    if (pm.supportedShopperInteractions.includes('Ecommerce')) {
      renderPaymentMethod(pm, true, imagePath);
    }
  };
}
function renderStoredPaymentMethods(data, imagePath) {
  if (data.length) {
    data.forEach(renderStoredPaymentMethod(imagePath));
  }
}
function renderPaymentMethods(_x, _x2, _x3) {
  return _renderPaymentMethods.apply(this, arguments);
}
function _renderPaymentMethods() {
  _renderPaymentMethods = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(paymentMethods, imagePath, adyenDescriptions) {
    var i, pm;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          i = 0;
        case 1:
          if (!(i < paymentMethods.length)) {
            _context2.next = 8;
            break;
          }
          pm = paymentMethods[i]; // eslint-disable-next-line
          _context2.next = 5;
          return renderPaymentMethod(pm, false, imagePath, adyenDescriptions[pm.type]);
        case 5:
          i += 1;
          _context2.next = 1;
          break;
        case 8:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _renderPaymentMethods.apply(this, arguments);
}
function renderPosTerminals(adyenConnectedTerminals) {
  var _adyenConnectedTermin;
  var removeChilds = function removeChilds() {
    var posTerminals = document.querySelector('#adyenPosTerminals');
    while (posTerminals.firstChild) {
      posTerminals.removeChild(posTerminals.firstChild);
    }
  };
  if (adyenConnectedTerminals !== null && adyenConnectedTerminals !== void 0 && (_adyenConnectedTermin = adyenConnectedTerminals.uniqueTerminalIds) !== null && _adyenConnectedTermin !== void 0 && _adyenConnectedTermin.length) {
    removeChilds();
    addPosTerminals(adyenConnectedTerminals.uniqueTerminalIds);
  }
}
function setAmazonPayConfig(adyenPaymentMethods) {
  var amazonpay = adyenPaymentMethods.paymentMethods.find(function (paymentMethod) {
    return paymentMethod.type === 'amazonpay';
  });
  if (amazonpay) {
    var _document$querySelect, _document$querySelect2, _document$querySelect3, _document$querySelect4, _document$querySelect5, _document$querySelect6, _document$querySelect7, _document$querySelect8;
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.configuration = amazonpay.configuration;
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.addressDetails = {
      name: "".concat((_document$querySelect = document.querySelector('#shippingFirstNamedefault')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.value, " ").concat((_document$querySelect2 = document.querySelector('#shippingLastNamedefault')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.value),
      addressLine1: (_document$querySelect3 = document.querySelector('#shippingAddressOnedefault')) === null || _document$querySelect3 === void 0 ? void 0 : _document$querySelect3.value,
      city: (_document$querySelect4 = document.querySelector('#shippingAddressCitydefault')) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.value,
      stateOrRegion: (_document$querySelect5 = document.querySelector('#shippingAddressCitydefault')) === null || _document$querySelect5 === void 0 ? void 0 : _document$querySelect5.value,
      postalCode: (_document$querySelect6 = document.querySelector('#shippingZipCodedefault')) === null || _document$querySelect6 === void 0 ? void 0 : _document$querySelect6.value,
      countryCode: (_document$querySelect7 = document.querySelector('#shippingCountrydefault')) === null || _document$querySelect7 === void 0 ? void 0 : _document$querySelect7.value,
      phoneNumber: (_document$querySelect8 = document.querySelector('#shippingPhoneNumberdefault')) === null || _document$querySelect8 === void 0 ? void 0 : _document$querySelect8.value
    };
  }
}
function setInstallments(amount) {
  try {
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    var installments = JSON.parse(window.installments.replace(/&quot;/g, '"'));
    if (installments.length) {
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions = {};
    }
    installments.forEach(function (installment) {
      var _installment = _slicedToArray(installment, 3),
        minAmount = _installment[0],
        numOfInstallments = _installment[1],
        cards = _installment[2];
      if (minAmount <= amount.value) {
        cards.forEach(function (cardType) {
          var installmentOptions = store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions;
          if (!installmentOptions[cardType]) {
            installmentOptions[cardType] = {
              values: [1]
            };
          }
          if (!installmentOptions[cardType].values.includes(numOfInstallments)) {
            installmentOptions[cardType].values.push(numOfInstallments);
            installmentOptions[cardType].values.sort(function (a, b) {
              return a - b;
            });
          }
        });
      }
    });
    store.checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
  } catch (e) {} // eslint-disable-line no-empty
}
function setGiftCardContainerVisibility() {
  var availableGiftCards = giftCardBrands();
  if (availableGiftCards.length === 0) {
    var giftCardContainer = document.querySelector('.gift-card-selection');
    giftCardContainer.style.display = 'none';
    var giftCardSeparator = document.querySelector('.gift-card-separator');
    giftCardSeparator.style.display = 'none';
  }
}
function initializeCheckout() {
  return _initializeCheckout.apply(this, arguments);
}
function _initializeCheckout() {
  _initializeCheckout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var paymentMethodsResponse, giftCardsData, totalDiscountedAmount, giftCards, lastGiftCard, paymentMethodsWithoutGiftCards, storedPaymentMethodsWithoutGiftCards, firstPaymentMethod;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return getPaymentMethods();
        case 2:
          paymentMethodsResponse = _context3.sent;
          _context3.next = 5;
          return fetchGiftCards();
        case 5:
          giftCardsData = _context3.sent;
          setCheckoutConfiguration(paymentMethodsResponse);
          store.checkoutConfiguration.paymentMethodsResponse = _objectSpread(_objectSpread({}, paymentMethodsResponse.AdyenPaymentMethods), {}, {
            imagePath: paymentMethodsResponse.imagePath
          });
          _context3.next = 10;
          return AdyenCheckout(store.checkoutConfiguration);
        case 10:
          store.checkout = _context3.sent;
          setGiftCardContainerVisibility();
          totalDiscountedAmount = giftCardsData.totalDiscountedAmount, giftCards = giftCardsData.giftCards;
          if (giftCards !== null && giftCards !== void 0 && giftCards.length) {
            store.addedGiftCards = giftCards;
            lastGiftCard = store.addedGiftCards[store.addedGiftCards.length - 1];
            store.partialPaymentsOrderObj = _objectSpread(_objectSpread({}, lastGiftCard), {}, {
              totalDiscountedAmount: totalDiscountedAmount
            });
          }
          setInstallments(paymentMethodsResponse.amount);
          setAmazonPayConfig(store.checkout.paymentMethodsResponse);
          document.querySelector('#paymentMethodsList').innerHTML = '';
          paymentMethodsWithoutGiftCards = store.checkout.paymentMethodsResponse.paymentMethods.filter(function (pm) {
            return pm.type !== constants.GIFTCARD;
          });
          storedPaymentMethodsWithoutGiftCards = store.checkout.paymentMethodsResponse.storedPaymentMethods.filter(function (pm) {
            return pm.type !== constants.GIFTCARD;
          }); // Rendering stored payment methods if one-click is enabled in BM
          if (window.adyenRecurringPaymentsEnabled) {
            renderStoredPaymentMethods(storedPaymentMethodsWithoutGiftCards, paymentMethodsResponse.imagePath);
          }
          _context3.next = 22;
          return renderPaymentMethods(paymentMethodsWithoutGiftCards, paymentMethodsResponse.imagePath, paymentMethodsResponse.adyenDescriptions);
        case 22:
          renderPosTerminals(paymentMethodsResponse.adyenConnectedTerminals);
          renderGiftCardLogo(paymentMethodsResponse.imagePath);
          firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
          if (firstPaymentMethod) {
            firstPaymentMethod.checked = true;
            helpers.displaySelectedMethod(firstPaymentMethod.value);
          }
          helpers.createShowConfirmationForm(window.ShowConfirmationPaymentFromComponent);
        case 27:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _initializeCheckout.apply(this, arguments);
}
(_document$getElementB = document.getElementById('email')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.addEventListener('change', function (e) {
  var emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
  if (emailPattern.test(e.target.value)) {
    var paymentMethodsConfiguration = store.checkoutConfiguration.paymentMethodsConfiguration;
    paymentMethodsConfiguration.card.clickToPayConfiguration.shopperEmail = e.target.value;
    var event = new Event(INIT_CHECKOUT_EVENT);
    document.dispatchEvent(event);
  }
});

// used by renderGiftCardComponent.js
document.addEventListener(INIT_CHECKOUT_EVENT, function () {
  var handleCheckoutEvent = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (!(Object.keys(store.componentsObj).length !== 0)) {
              _context.next = 3;
              break;
            }
            _context.next = 3;
            return unmountComponents();
          case 3:
            _context.next = 5;
            return initializeCheckout();
          case 5:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function handleCheckoutEvent() {
      return _ref4.apply(this, arguments);
    };
  }();
  handleCheckoutEvent();
});

/**
 * Calls getPaymentMethods and then renders the retrieved payment methods (including card component)
 */
function renderGenericComponent() {
  return _renderGenericComponent.apply(this, arguments);
}
function _renderGenericComponent() {
  _renderGenericComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var _store$addedGiftCards2;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          if (!(Object.keys(store.componentsObj).length !== 0)) {
            _context4.next = 3;
            break;
          }
          _context4.next = 3;
          return unmountComponents();
        case 3:
          _context4.next = 5;
          return initializeCheckout();
        case 5:
          if ((_store$addedGiftCards2 = store.addedGiftCards) !== null && _store$addedGiftCards2 !== void 0 && _store$addedGiftCards2.length) {
            applyGiftCards();
          }
          attachGiftCardAddButtonListener();
        case 7:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _renderGenericComponent.apply(this, arguments);
}
module.exports = {
  renderGenericComponent: renderGenericComponent,
  initializeCheckout: initializeCheckout,
  setInstallments: setInstallments,
  setAmazonPayConfig: setAmazonPayConfig,
  renderStoredPaymentMethods: renderStoredPaymentMethods,
  renderPaymentMethods: renderPaymentMethods,
  renderPosTerminals: renderPosTerminals,
  isCartModified: isCartModified,
  resolveUnmount: resolveUnmount,
  renderGiftCardLogo: renderGiftCardLogo,
  setGiftCardContainerVisibility: setGiftCardContainerVisibility,
  applyGiftCards: applyGiftCards,
  INIT_CHECKOUT_EVENT: INIT_CHECKOUT_EVENT
};