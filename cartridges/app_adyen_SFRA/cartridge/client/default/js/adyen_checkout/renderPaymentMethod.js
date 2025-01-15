"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var store = require('../../../../store');
var helpers = require('./helpers');
var constants = require('../constants');
function getFallback(paymentMethod) {
  var fallback = {};
  if (fallback[paymentMethod.type]) {
    store.componentsObj[paymentMethod.type] = {};
  }
  return fallback[paymentMethod.type];
}
function getPersonalDetails() {
  var _document$querySelect, _document$querySelect2, _document$querySelect3, _document$querySelect4;
  return {
    firstName: (_document$querySelect = document.querySelector('#shippingFirstNamedefault')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.value,
    lastName: (_document$querySelect2 = document.querySelector('#shippingLastNamedefault')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.value,
    telephoneNumber: (_document$querySelect3 = document.querySelector('#shippingPhoneNumberdefault')) === null || _document$querySelect3 === void 0 ? void 0 : _document$querySelect3.value,
    shopperEmail: (_document$querySelect4 = document.querySelector('.customer-summary-email')) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.textContent
  };
}
function setNode(paymentMethodID) {
  var createNode = function createNode() {
    if (!store.componentsObj[paymentMethodID]) {
      store.componentsObj[paymentMethodID] = {};
    }
    try {
      var _store$checkout;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // ALl nodes created for the checkout component are enriched with shopper personal details
      var node = (_store$checkout = store.checkout).create.apply(_store$checkout, args.concat([{
        data: _objectSpread(_objectSpread({}, getPersonalDetails()), {}, {
          personalDetails: getPersonalDetails()
        }),
        visibility: {
          personalDetails: 'editable',
          billingAddress: 'hidden',
          deliveryAddress: 'hidden'
        }
      }]));
      store.componentsObj[paymentMethodID].node = node;
      store.componentsObj[paymentMethodID].isValid = node.isValid;
    } catch (e) {
      /* No component for payment method */
    }
  };
  return createNode;
}
function getPaymentMethodID(isStored, paymentMethod) {
  if (isStored) {
    return "storedCard".concat(paymentMethod.id);
  }
  if (paymentMethod.type === constants.GIFTCARD) {
    return constants.GIFTCARD;
  }
  if (paymentMethod.brand) {
    return "".concat(paymentMethod.type, "_").concat(paymentMethod.brand);
  }
  return paymentMethod.type;
}
function getImage(isStored, paymentMethod) {
  return isStored ? paymentMethod.brand : paymentMethod.type;
}
function getLabel(isStored, paymentMethod) {
  var label = isStored ? " ".concat(store.MASKED_CC_PREFIX).concat(paymentMethod.lastFour) : '';
  return "".concat(paymentMethod.name).concat(label);
}
function handleFallbackPayment(_ref) {
  var paymentMethod = _ref.paymentMethod,
    container = _ref.container,
    paymentMethodID = _ref.paymentMethodID;
  var fallback = getFallback(paymentMethod);
  var createTemplate = function createTemplate() {
    var template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
  };
  return fallback ? createTemplate() : setNode(paymentMethod.type)(paymentMethodID);
}
function handlePayment(options) {
  return options.isStored ? setNode(options.paymentMethodID)('card', options.paymentMethod) : handleFallbackPayment(options);
}
function getListContents(_ref2) {
  var imagePath = _ref2.imagePath,
    isStored = _ref2.isStored,
    paymentMethod = _ref2.paymentMethod,
    description = _ref2.description;
  var paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
  var label = getLabel(isStored, paymentMethod);
  var liContents = "\n    <input name=\"brandCode\" type=\"radio\" value=\"".concat(paymentMethodID, "\" id=\"rb_").concat(paymentMethodID, "\">\n    <img class=\"paymentMethod_img\" src=\"").concat(imagePath, "\" ></img>\n    <label id=\"lb_").concat(paymentMethodID, "\" for=\"rb_").concat(paymentMethodID, "\">").concat(label, "</label>\n  ");
  return description ? "".concat(liContents, "<p>").concat(description, "</p>") : liContents;
}
function getImagePath(_ref3) {
  var isStored = _ref3.isStored,
    paymentMethod = _ref3.paymentMethod,
    path = _ref3.path,
    isSchemeNotStored = _ref3.isSchemeNotStored;
  var paymentMethodImage = "".concat(path).concat(getImage(isStored, paymentMethod), ".png");
  var cardImage = "".concat(path, "card.png");
  return isSchemeNotStored ? cardImage : paymentMethodImage;
}
function setValid(_ref4) {
  var isStored = _ref4.isStored,
    paymentMethodID = _ref4.paymentMethodID;
  if (isStored && ['bcmc', 'scheme'].indexOf(paymentMethodID) > -1) {
    store.componentsObj[paymentMethodID].isValid = true;
  }
}
function configureContainer(_ref5) {
  var paymentMethodID = _ref5.paymentMethodID,
    container = _ref5.container;
  container.classList.add('additionalFields');
  container.setAttribute('id', "component_".concat(paymentMethodID));
  container.setAttribute('style', 'display:none');
}
function handleInput(_ref6) {
  var paymentMethodID = _ref6.paymentMethodID;
  var input = document.querySelector("#rb_".concat(paymentMethodID));
  input.onchange = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(event) {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            helpers.displaySelectedMethod(event.target.value);
          case 1:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref7.apply(this, arguments);
    };
  }();
}
function createListItem(rerender, paymentMethodID, liContents) {
  var li;
  if (rerender) {
    li = document.querySelector("#rb_".concat(paymentMethodID)).closest('li');
  } else {
    li = document.createElement('li');
    li.innerHTML = liContents;
    li.classList.add('paymentMethod');
  }
  return li;
}
function checkIfNodeIsAvailable(_x2) {
  return _checkIfNodeIsAvailable.apply(this, arguments);
}
function _checkIfNodeIsAvailable() {
  _checkIfNodeIsAvailable = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(node) {
    var isNodeAvailable;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          if (!node.isAvailable) {
            _context3.next = 6;
            break;
          }
          _context3.next = 3;
          return node.isAvailable();
        case 3:
          isNodeAvailable = _context3.sent;
          if (isNodeAvailable) {
            _context3.next = 6;
            break;
          }
          return _context3.abrupt("return", false);
        case 6:
          return _context3.abrupt("return", true);
        case 7:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _checkIfNodeIsAvailable.apply(this, arguments);
}
function appendNodeToContainerIfAvailable(_x3, _x4, _x5, _x6) {
  return _appendNodeToContainerIfAvailable.apply(this, arguments);
}
function _appendNodeToContainerIfAvailable() {
  _appendNodeToContainerIfAvailable = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(paymentMethodsUI, li, node, container) {
    var canBeMounted;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          if (!node) {
            _context4.next = 5;
            break;
          }
          _context4.next = 3;
          return checkIfNodeIsAvailable(node);
        case 3:
          canBeMounted = _context4.sent;
          if (canBeMounted) {
            paymentMethodsUI.append(li);
            node.mount(container);
          }
        case 5:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _appendNodeToContainerIfAvailable.apply(this, arguments);
}
module.exports.renderPaymentMethod = /*#__PURE__*/function () {
  var _renderPaymentMethod = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(paymentMethod, isStored, path) {
    var description,
      rerender,
      canRender,
      _store$componentsObj$,
      paymentMethodsUI,
      paymentMethodID,
      isSchemeNotStored,
      container,
      options,
      imagePath,
      liContents,
      li,
      _args2 = arguments;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          description = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : null;
          rerender = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : false;
          _context2.prev = 2;
          paymentMethodsUI = document.querySelector('#paymentMethodsList');
          paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
          if (!(paymentMethodID === constants.GIFTCARD)) {
            _context2.next = 7;
            break;
          }
          return _context2.abrupt("return");
        case 7:
          isSchemeNotStored = paymentMethod.type === 'scheme' && !isStored;
          container = document.createElement('div');
          options = {
            container: container,
            paymentMethod: paymentMethod,
            isStored: isStored,
            path: path,
            description: description,
            paymentMethodID: paymentMethodID,
            isSchemeNotStored: isSchemeNotStored
          };
          imagePath = getImagePath(options);
          liContents = getListContents(_objectSpread(_objectSpread({}, options), {}, {
            imagePath: imagePath,
            description: description
          }));
          li = createListItem(rerender, paymentMethodID, liContents);
          handlePayment(options);
          configureContainer(options);
          li.append(container);
          _context2.next = 18;
          return appendNodeToContainerIfAvailable(paymentMethodsUI, li, (_store$componentsObj$ = store.componentsObj[paymentMethodID]) === null || _store$componentsObj$ === void 0 ? void 0 : _store$componentsObj$.node, container);
        case 18:
          if (paymentMethodID === constants.GIROPAY) {
            container.innerHTML = '';
          }
          handleInput(options);
          setValid(options);
          canRender = true;
          _context2.next = 27;
          break;
        case 24:
          _context2.prev = 24;
          _context2.t0 = _context2["catch"](2);
          // method not available
          canRender = false;
        case 27:
          return _context2.abrupt("return", canRender);
        case 28:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[2, 24]]);
  }));
  function renderPaymentMethod(_x7, _x8, _x9) {
    return _renderPaymentMethod.apply(this, arguments);
  }
  return renderPaymentMethod;
}();