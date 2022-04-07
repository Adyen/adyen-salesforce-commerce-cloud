"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var store = require('../../../../store');

var helpers = require('./helpers');

var _require = require('./qrCodeMethods'),
    qrCodeMethods = _require.qrCodeMethods;

function getFallback(paymentMethod) {
  var fallback = {
    giftcard: "\n        <input type=\"hidden\" class=\"brand\" name=\"brand\" value=\"".concat(paymentMethod.brand, "\"/>\n        <input type=\"hidden\" class=\"type\" name=\"type\" value=\"").concat(paymentMethod.type, "\"/>")
  };

  if (fallback[paymentMethod.type]) {
    store.componentsObj[paymentMethod.type] = {};
  }

  return fallback[paymentMethod.type];
}

function getPersonalDetails() {
  var _document$querySelect, _document$querySelect2, _document$querySelect3, _document$querySelect4, _document$querySelect5, _document$querySelect6, _document$querySelect7, _document$querySelect8, _document$querySelect9, _document$querySelect10, _document$querySelect11, _document$querySelect12, _document$querySelect13, _document$querySelect14, _document$querySelect15, _document$querySelect16;

  return {
    firstName: (_document$querySelect = document.querySelector('#shippingFirstNamedefault')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.value,
    lastName: (_document$querySelect2 = document.querySelector('#shippingLastNamedefault')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.value,
    telephoneNumber: (_document$querySelect3 = document.querySelector('#shippingPhoneNumberdefault')) === null || _document$querySelect3 === void 0 ? void 0 : _document$querySelect3.value,
    shopperEmail: (_document$querySelect4 = document.querySelector('.customer-summary-email')) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.textContent,
    billingAddress: {
      city: (_document$querySelect5 = document.querySelector('#billingAddressCity')) === null || _document$querySelect5 === void 0 ? void 0 : _document$querySelect5.value,
      postalCode: (_document$querySelect6 = document.querySelector('#billingZipCode')) === null || _document$querySelect6 === void 0 ? void 0 : _document$querySelect6.value,
      country: (_document$querySelect7 = document.querySelector('#billingCountry')) === null || _document$querySelect7 === void 0 ? void 0 : _document$querySelect7.value,
      stateOrProvince: (_document$querySelect8 = document.querySelector('#billingState')) === null || _document$querySelect8 === void 0 ? void 0 : _document$querySelect8.value,
      street: (_document$querySelect9 = document.querySelector('#billingAddressOne')) === null || _document$querySelect9 === void 0 ? void 0 : _document$querySelect9.value,
      houseNumberOrName: (_document$querySelect10 = document.querySelector('#billingAddressTwo')) === null || _document$querySelect10 === void 0 ? void 0 : _document$querySelect10.value
    },
    deliveryAddress: {
      city: (_document$querySelect11 = document.querySelector('#shippingAddressCitydefault')) === null || _document$querySelect11 === void 0 ? void 0 : _document$querySelect11.value,
      postalCode: (_document$querySelect12 = document.querySelector('#shippingZipCodedefault')) === null || _document$querySelect12 === void 0 ? void 0 : _document$querySelect12.value,
      country: (_document$querySelect13 = document.querySelector('#shippingCountrydefault')) === null || _document$querySelect13 === void 0 ? void 0 : _document$querySelect13.value,
      stateOrProvince: (_document$querySelect14 = document.querySelector('#shippingStatedefault')) === null || _document$querySelect14 === void 0 ? void 0 : _document$querySelect14.value,
      street: (_document$querySelect15 = document.querySelector('#shippingAddressOnedefault')) === null || _document$querySelect15 === void 0 ? void 0 : _document$querySelect15.value,
      houseNumberOrName: (_document$querySelect16 = document.querySelector('#shippingAddressTwodefault')) === null || _document$querySelect16 === void 0 ? void 0 : _document$querySelect16.value
    }
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
        })
      }]));

      store.componentsObj[paymentMethodID].node = node;
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

  if (paymentMethod.brand) {
    // gift cards all share the same type. Brand is used to differentiate between them
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

function hasNoChildNodes(_ref4) {
  var paymentMethodID = _ref4.paymentMethodID,
      container = _ref4.container;
  return store.componentsObj[paymentMethodID] && !container.childNodes[0];
}

function setValid(_ref5) {
  var paymentMethodID = _ref5.paymentMethodID,
      container = _ref5.container;

  if (hasNoChildNodes({
    paymentMethodID: paymentMethodID,
    container: container
  }) && ['bcmc', 'scheme'].indexOf(paymentMethodID) === -1) {
    store.componentsObj[paymentMethodID].isValid = true;
  }
}

function configureContainer(_ref6) {
  var paymentMethodID = _ref6.paymentMethodID,
      container = _ref6.container;
  container.classList.add('additionalFields');
  container.setAttribute('id', "component_".concat(paymentMethodID));
  container.setAttribute('style', 'display:none');
}

function handleInput(_ref7) {
  var paymentMethodID = _ref7.paymentMethodID;
  var input = document.querySelector("#rb_".concat(paymentMethodID));

  input.onchange = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee(event) {
      var _store$componentsObj$, compName, qrComponent, node;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(document.querySelector('.adyen-checkout__qr-loader') && qrCodeMethods.indexOf(store.selectedMethod) > -1)) {
                _context.next = 10;
                break;
              }

              compName = store.selectedMethod;
              qrComponent = store.componentsObj[compName];
              _context.next = 5;
              return Promise.resolve(qrComponent.node.unmount("component_".concat(compName)));

            case 5:
              delete store.componentsObj[compName];
              setNode(compName)(compName);
              node = (_store$componentsObj$ = store.componentsObj[compName]) === null || _store$componentsObj$ === void 0 ? void 0 : _store$componentsObj$.node;

              if (node) {
                node.mount(document.querySelector("#component_".concat(compName)));
              }

              helpers.paymentFromComponent({
                cancelTransaction: true,
                merchantReference: document.querySelector('#merchantReference').value
              });

            case 10:
              helpers.displaySelectedMethod(event.target.value);

            case 11:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref8.apply(this, arguments);
    };
  }();
}

module.exports.renderPaymentMethod = function renderPaymentMethod(paymentMethod, isStored, path) {
  var _store$componentsObj$2;

  var description = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var paymentMethodsUI = document.querySelector('#paymentMethodsList');
  var li = document.createElement('li');
  var paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
  var isSchemeNotStored = paymentMethod.type === 'scheme' && !isStored;
  var container = document.createElement('div');
  var options = {
    container: container,
    paymentMethod: paymentMethod,
    isStored: isStored,
    path: path,
    description: description,
    paymentMethodID: paymentMethodID,
    isSchemeNotStored: isSchemeNotStored
  };
  var imagePath = getImagePath(options);
  var liContents = getListContents(_objectSpread(_objectSpread({}, options), {}, {
    imagePath: imagePath
  }));
  li.innerHTML = liContents;
  li.classList.add('paymentMethod');
  handlePayment(options);
  configureContainer(options);
  li.append(container);
  paymentMethodsUI.append(li);
  var node = (_store$componentsObj$2 = store.componentsObj[paymentMethodID]) === null || _store$componentsObj$2 === void 0 ? void 0 : _store$componentsObj$2.node;

  if (node) {
    node.mount(container);
  }

  if (paymentMethodID === 'giropay') {
    container.innerHTML = '';
  }

  handleInput(options);
  setValid(options);
};