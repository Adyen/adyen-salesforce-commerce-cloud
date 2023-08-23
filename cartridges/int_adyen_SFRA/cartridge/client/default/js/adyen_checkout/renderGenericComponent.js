"use strict";

var _document$getElementB;
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/* eslint-disable no-unsafe-optional-chaining */
var store = require('../../../../store');
var _require = require('./renderPaymentMethod'),
  renderPaymentMethod = _require.renderPaymentMethod;
var helpers = require('./helpers');
var _require2 = require('./localesUsingInstallments'),
  installmentLocales = _require2.installmentLocales;
var _require3 = require('../commons'),
  createSession = _require3.createSession,
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
  if (data.storedPaymentMethods) {
    var storedPaymentMethods = data.storedPaymentMethods;
    storedPaymentMethods.forEach(renderStoredPaymentMethod(imagePath));
  }
}
function renderPaymentMethods(paymentMethods, imagePath, adyenDescriptions) {
  var promises = [];
  for (var i = 0; i < paymentMethods.length; i += 1) {
    var pm = paymentMethods[i];
    promises.push(renderPaymentMethod(pm, false, imagePath, adyenDescriptions[pm.type]));
  }
  return Promise.all(promises);
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
    var _window$installments;
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    var _window$installments$ = (_window$installments = window.installments) === null || _window$installments === void 0 ? void 0 : _window$installments.replace(/\[|]/g, '').split(','),
      _window$installments$2 = _slicedToArray(_window$installments$, 2),
      minAmount = _window$installments$2[0],
      numOfInstallments = _window$installments$2[1];
    if (minAmount <= amount.value) {
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions = {
        card: {}
      }; // eslint-disable-next-line max-len
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions.card.values = helpers.getInstallmentValues(numOfInstallments);
      store.checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
    }
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
  _initializeCheckout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var session, giftCardsData, totalDiscountedAmount, giftCards, lastGiftCard, paymentMethodsWithoutGiftCards, firstPaymentMethod;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return createSession();
        case 2:
          session = _context.sent;
          _context.next = 5;
          return fetchGiftCards();
        case 5:
          giftCardsData = _context.sent;
          store.checkoutConfiguration.session = {
            id: session.id,
            sessionData: session.sessionData,
            imagePath: session.imagePath,
            adyenDescriptions: session.adyenDescriptions
          };
          _context.next = 9;
          return AdyenCheckout(store.checkoutConfiguration);
        case 9:
          store.checkout = _context.sent;
          setGiftCardContainerVisibility();
          totalDiscountedAmount = giftCardsData.totalDiscountedAmount, giftCards = giftCardsData.giftCards;
          if (giftCards !== null && giftCards !== void 0 && giftCards.length) {
            store.addedGiftCards = giftCards;
            lastGiftCard = store.addedGiftCards[store.addedGiftCards.length - 1];
            store.partialPaymentsOrderObj = _objectSpread(_objectSpread({}, lastGiftCard), {}, {
              totalDiscountedAmount: totalDiscountedAmount
            });
          }
          setCheckoutConfiguration(store.checkout.options);
          setInstallments(store.checkout.options.amount);
          setAmazonPayConfig(store.checkout.paymentMethodsResponse);
          document.querySelector('#paymentMethodsList').innerHTML = '';
          paymentMethodsWithoutGiftCards = store.checkout.paymentMethodsResponse.paymentMethods.filter(function (pm) {
            return pm.type !== constants.GIFTCARD;
          });
          renderStoredPaymentMethods(paymentMethodsWithoutGiftCards, session.imagePath);
          _context.next = 21;
          return renderPaymentMethods(paymentMethodsWithoutGiftCards, session.imagePath, session.adyenDescriptions);
        case 21:
          renderPosTerminals(session.adyenConnectedTerminals);
          renderGiftCardLogo(session.imagePath);
          firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
          if (firstPaymentMethod) {
            firstPaymentMethod.checked = true;
            helpers.displaySelectedMethod(firstPaymentMethod.value);
          }
          helpers.createShowConfirmationForm(window.ShowConfirmationPaymentFromComponent);
        case 26:
        case "end":
          return _context.stop();
      }
    }, _callee);
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
  initializeCheckout();
});

/**
 * Calls createSession and then renders the retrieved payment methods (including card component)
 */
function renderGenericComponent() {
  return _renderGenericComponent.apply(this, arguments);
}
function _renderGenericComponent() {
  _renderGenericComponent = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var _store$addedGiftCards2;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!(Object.keys(store.componentsObj).length !== 0)) {
            _context2.next = 3;
            break;
          }
          _context2.next = 3;
          return unmountComponents();
        case 3:
          _context2.next = 5;
          return initializeCheckout();
        case 5:
          if ((_store$addedGiftCards2 = store.addedGiftCards) !== null && _store$addedGiftCards2 !== void 0 && _store$addedGiftCards2.length) {
            applyGiftCards();
          }
          attachGiftCardAddButtonListener();
        case 7:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _renderGenericComponent.apply(this, arguments);
}
module.exports = {
  renderGenericComponent: renderGenericComponent,
  initializeCheckout: initializeCheckout,
  INIT_CHECKOUT_EVENT: INIT_CHECKOUT_EVENT
};