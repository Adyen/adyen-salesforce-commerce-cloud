"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
var helpers = require('./helpers');
var _require = require('../commons'),
  onBrand = _require.onBrand,
  onFieldValid = _require.onFieldValid;
var store = require('../../../../store');
var constants = require('../constants');
var _require2 = require('./renderGiftcardComponent'),
  createElementsToShowRemainingGiftCardAmount = _require2.createElementsToShowRemainingGiftCardAmount,
  renderAddedGiftCard = _require2.renderAddedGiftCard,
  getGiftCardElements = _require2.getGiftCardElements,
  showGiftCardInfoMessage = _require2.showGiftCardInfoMessage;
function getCardConfig() {
  return {
    enableStoreDetails: window.showStoreDetails,
    showBrandsUnderCardNumber: false,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      var method = state.data.paymentMethod.storedPaymentMethodId ? "storedCard".concat(state.data.paymentMethod.storedPaymentMethodId) : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
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
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }
      store.paypalTerminatedEarly = true;
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return actions.reject();
      }
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
    giftCardsList = _getGiftCardElements.giftCardsList;
  giftCardSelectContainer.classList.add('invisible');
  giftCardSelect.value = null;
  giftCardsList.innerHTML = '';
  store.componentsObj.giftcard.node.unmount('component_giftcard');
  store.addedGiftCards.forEach(function (card) {
    renderAddedGiftCard(card);
  });
  if ((_store$addedGiftCards = store.addedGiftCards) !== null && _store$addedGiftCards !== void 0 && _store$addedGiftCards.length) {
    showGiftCardInfoMessage();
  }
  createElementsToShowRemainingGiftCardAmount();
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
      $.ajax({
        type: 'POST',
        url: 'Adyen-CheckBalance',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function success(data) {
          giftcardBalance = data.balance;
          document.querySelector('button[value="submit-payment"]').disabled = false;
          if (data.resultCode === constants.SUCCESS) {
            var _getGiftCardElements2 = getGiftCardElements(),
              giftCardsInfoMessageContainer = _getGiftCardElements2.giftCardsInfoMessageContainer,
              giftCardSelect = _getGiftCardElements2.giftCardSelect;
            if (giftCardSelect) {
              giftCardSelect.classList.add('invisible');
            }
            document.querySelector('button[value="submit-payment"]').disabled = true;
            giftCardsInfoMessageContainer.innerHTML = '';
            giftCardsInfoMessageContainer.classList.remove('gift-cards-info-message-container');
            resolve(data);
          } else if (data.resultCode === constants.NOTENOUGHBALANCE) {
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
      var giftCardData = requestData.paymentMethod;
      $.ajax({
        type: 'POST',
        url: 'Adyen-PartialPaymentsOrder',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function success(data) {
          if (data.resultCode === 'Success') {
            // make payments call including giftcard data and order data
            var brandSelect = document.getElementById('giftCardSelect');
            var selectedBrandIndex = brandSelect.selectedIndex;
            var giftcardBrand = brandSelect.options[selectedBrandIndex].text;
            var partialPaymentRequest = {
              paymentMethod: giftCardData,
              amount: giftcardBalance,
              partialPaymentsOrder: {
                pspReference: data.pspReference,
                orderData: data.orderData
              },
              giftcardBrand: giftcardBrand
            };
            var partialPaymentResponse = helpers.makePartialPayment(partialPaymentRequest);
            if (partialPaymentResponse !== null && partialPaymentResponse !== void 0 && partialPaymentResponse.error) {
              reject();
            } else {
              handlePartialPaymentSuccess();
            }
          }
        }
      });
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
function handleOnChange(state) {
  store.isValid = state.isValid;
  if (!store.componentsObj[store.selectedMethod]) {
    store.componentsObj[store.selectedMethod] = {};
  }
  store.componentsObj[store.selectedMethod].isValid = store.isValid;
  store.componentsObj[store.selectedMethod].stateData = state.data;
}
var actionHandler = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(action) {
    var checkout;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
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
          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function actionHandler(_x) {
    return _ref.apply(this, arguments);
  };
}();
function handleOnAdditionalDetails(state) {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify({
      data: state.data,
      orderToken: window.orderToken
    }),
    contentType: 'application/json; charset=utf-8',
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
    onSubmit: function onSubmit(state, component) {
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
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
    paypal: getPaypalConfig(),
    amazonpay: getAmazonpayConfig(),
    giftcard: getGiftCardConfig(),
    applepay: getApplePayConfig()
  };
}
module.exports = {
  getCardConfig: getCardConfig,
  getPaypalConfig: getPaypalConfig,
  getGooglePayConfig: getGooglePayConfig,
  getAmazonpayConfig: getAmazonpayConfig,
  setCheckoutConfiguration: setCheckoutConfiguration,
  actionHandler: actionHandler
};