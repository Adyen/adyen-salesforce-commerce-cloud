"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

require('./bundle');

require('./adyen-giving');

var qrCodeMethods = ['swish', 'wechatpayQR', 'bcmc_mobile'];
var maskedCardNumber;
var MASKED_CC_PREFIX = '************';
var selectedMethod;
var componentsObj = {};
var checkoutConfiguration;
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

  if (window.getPaymentMethodsResponse) {
    paymentMethodsResponse = window.getPaymentMethodsResponse;
    checkoutConfiguration = window.Configuration;

    checkoutConfiguration.onChange = function (state
    /* , component */
    ) {
      var type = state.data.paymentMethod.type;
      isValid = state.isValid;

      if (!componentsObj[type]) {
        componentsObj[type] = {};
      }

      componentsObj[type].isValid = isValid;
      componentsObj[type].stateData = state.data;
    };

    checkoutConfiguration.showPayButton = false;
    checkoutConfiguration.paymentMethodsConfiguration = {
      card: {
        enableStoreDetails: showStoreDetails,
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
          var componentName = state.data.paymentMethod.storedPaymentMethodId ? "storedCard".concat(state.data.paymentMethod.storedPaymentMethodId) : state.data.paymentMethod.type;

          if (componentName === selectedMethod || selectedMethod === 'bcmc') {
            $('#browserInfo').val(JSON.stringify(state.data.browserInfo));
            componentsObj[selectedMethod].isValid = isValid;
            componentsObj[selectedMethod].stateData = state.data;
          }
        }
      },
      boletobancario: {
        personalDetailsRequired: true,
        // turn personalDetails section on/off
        billingAddressRequired: false,
        // turn billingAddress section on/off
        showEmailAddress: false // allow shopper to specify their email address

      },
      paywithgoogle: {
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
      },
      paypal: {
        environment: window.Configuration.environment,
        intent: window.paypalIntent,
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
        onError: function onError()
        /* error, component */
        {
          paypalTerminatedEarly = false;
          $('#dwfrm_billing').trigger('submit');
        },
        onAdditionalDetails: function onAdditionalDetails(state
        /* , component */
        ) {
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
        onError: function onError()
        /* error, component */
        {
          $('#dwfrm_billing').trigger('submit');
        },
        onAdditionalDetails: function onAdditionalDetails(state
        /* , component */
        ) {
          document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(state.data);
          $('#dwfrm_billing').trigger('submit');
        }
      },
      swish: getQRCodeConfig(),
      bcmc_mobile: getQRCodeConfig(),
      wechatpayQR: getQRCodeConfig(),
      afterpay_default: {
        visibility: {
          personalDetails: 'editable',
          billingAddress: 'hidden',
          deliveryAddress: 'hidden'
        },
        data: {
          personalDetails: {
            firstName: document.querySelector('#dwfrm_billing_billingAddress_addressFields_firstName').value,
            lastName: document.querySelector('#dwfrm_billing_billingAddress_addressFields_lastName').value,
            telephoneNumber: document.querySelector('#dwfrm_billing_billingAddress_addressFields_phone').value,
            shopperEmail: document.querySelector('#dwfrm_billing_billingAddress_email_emailAddress').value
          }
        }
      },
      facilypay_3x: {
        visibility: {
          personalDetails: 'editable',
          billingAddress: 'hidden',
          deliveryAddress: 'hidden'
        },
        data: {
          personalDetails: {
            firstName: document.querySelector('#dwfrm_billing_billingAddress_addressFields_firstName').value,
            lastName: document.querySelector('#dwfrm_billing_billingAddress_addressFields_lastName').value,
            telephoneNumber: document.querySelector('#dwfrm_billing_billingAddress_addressFields_phone').value,
            shopperEmail: document.querySelector('#dwfrm_billing_billingAddress_email_emailAddress').value
          }
        }
      }
    };

    if (window.installments) {
      try {
        var installments = JSON.parse(window.installments);
        checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
      } catch (e) {} // eslint-disable-line no-empty

    }

    if (window.googleMerchantID !== 'null' && window.Configuration.environment === 'live') {
      checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration.merchantIdentifier = window.googleMerchantID;
    }

    if (window.paypalMerchantID !== 'null') {
      checkoutConfiguration.paymentMethodsConfiguration.paypal.merchantId = window.paypalMerchantID;
    }

    if (window.cardholderNameBool !== 'null') {
      checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
      checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
    }

    renderGenericComponent();
  }
}
/**
 * @function
 * @description Initializes Adyen Checkout My Account events
 */


function initializeAccountEvents() {
  checkoutConfiguration = window.Configuration;
  checkout = new AdyenCheckout(checkoutConfiguration);
  var newCard = document.getElementById('newCard');
  var adyenStateData;
  var isValid = false;
  var node = checkout.create('card', {
    hasHolderName: true,
    holderNameRequired: true,
    onChange: function onChange(state) {
      adyenStateData = state.data;
      isValid = state.isValid;
    }
  }).mount(newCard);
  $('#applyBtn').on('click', function () {
    if (!isValid) {
      node.showValidation();
      return false;
    }

    document.querySelector('#adyenStateData').value = JSON.stringify(adyenStateData);
  });
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

  if (['paypal', 'paywithgoogle', 'mbway'].concat(qrCodeMethods).indexOf(type) > -1) {
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

  if (selectedMethod === 'ach') {
    var inputs = document.querySelectorAll('#component_ach > input');
    inputs = Object.values(inputs).filter(function (input) {
      return !(input.value && input.value.length > 0);
    });

    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.add('adyen-checkout__input--error');
    }

    if (inputs.length) {
      return false;
    }
  } else if (selectedMethod === 'ratepay') {
    var input = document.querySelector('#dateOfBirthInput');

    if (!(input.value && input.value.length > 0)) {
      input.classList.add('adyen-checkout__input--error');
      return false;
    }
  }

  return true;
}
/**
 * Assigns stateData value to the hidden stateData input field
 * so it's sent to the backend for processing
 */


function validateComponents() {
  if (document.querySelector('#component_ach')) {
    var inputs = document.querySelectorAll('#component_ach > input');

    var _iterator = _createForOfIteratorHelper(inputs),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var input = _step.value;

        input.onchange = function () {
          validateCustomInputField(this);
        };
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  if (document.querySelector('#dateOfBirthInput')) {
    document.querySelector('#dateOfBirthInput').onchange = function () {
      validateCustomInputField(this);
    };
  }

  var stateData;

  if (componentsObj[selectedMethod] && componentsObj[selectedMethod].stateData) {
    stateData = componentsObj[selectedMethod].stateData;
  } else {
    stateData = {
      paymentMethod: {
        type: selectedMethod
      }
    };
  }

  if (selectedMethod === 'ach') {
    var bankAccount = {
      ownerName: document.querySelector('#bankAccountOwnerNameValue').value,
      bankAccountNumber: document.querySelector('#bankAccountNumberValue').value,
      bankLocationId: document.querySelector('#bankLocationIdValue').value
    };
    stateData.paymentMethod = _objectSpread(_objectSpread({}, stateData.paymentMethod), {}, {
      bankAccount: bankAccount
    });
  } else if (selectedMethod === 'ratepay') {
    if (document.querySelector('#genderInput').value && document.querySelector('#dateOfBirthInput').value) {
      stateData.shopperName = {
        gender: document.querySelector('#genderInput').value
      };
      stateData.dateOfBirth = document.querySelector('#dateOfBirthInput').value;
    }
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(stateData);
}

function validateCustomInputField(input) {
  if (input.value === '') {
    input.classList.add('adyen-checkout__input--error');
  } else if (input.value.length > 0) {
    input.classList.remove('adyen-checkout__input--error');
  }
}
/**
 * Contains fallback components for payment methods that don't have an Adyen web component yet
 */


function getFallback(paymentMethod) {
  var ratepay = "<span class=\"adyen-checkout__label\">Gender</span>\n                    <select id=\"genderInput\" class=\"adyen-checkout__input\">\n                        <option value=\"MALE\">Male</option>\n                        <option value=\"FEMALE\">Female</option>\n                    </select>\n                    <span class=\"adyen-checkout__label\">Date of birth</span>\n                    <input id=\"dateOfBirthInput\" class=\"adyen-checkout__input\" type=\"date\"/>";
  var fallback = {
    ratepay: ratepay
  };
  return fallback[paymentMethod];
}
/**
 * checks if payment method is blocked and returns a boolean accordingly
 */


function isMethodTypeBlocked(methodType) {
  var blockedMethods = ['bcmc_mobile_QR', 'applepay', 'cup', 'wechatpay', 'wechatpay_pos', 'wechatpaySdk', 'wechatpayQr'];
  return blockedMethods.includes(methodType);
}
/**
 * Calls getPaymenMethods and then renders the retrieved payment methods (including card component)
 */


function renderGenericComponent() {
  return _renderGenericComponent.apply(this, arguments);
}

function _renderGenericComponent() {
  _renderGenericComponent = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var paymentMethod, i, paymentMethods, firstPaymentMethod;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!Object.keys(componentsObj).length) {
              _context2.next = 3;
              break;
            }

            _context2.next = 3;
            return unmountComponents();

          case 3:
            checkoutConfiguration.paymentMethodsResponse = paymentMethodsResponse.adyenPaymentMethods;
            paymentMethods = paymentMethodsResponse.adyenPaymentMethods;

            if (paymentMethodsResponse.amount) {
              checkoutConfiguration.amount = paymentMethodsResponse.amount;
              checkoutConfiguration.paymentMethodsConfiguration.paypal.amount = paymentMethodsResponse.amount;
            }

            if (paymentMethodsResponse.countryCode) {
              checkoutConfiguration.countryCode = paymentMethodsResponse.countryCode;
            }

            checkout = new AdyenCheckout(checkoutConfiguration);
            document.querySelector('#paymentMethodsList').innerHTML = '';

            if (paymentMethods.storedPaymentMethods) {
              for (i = 0; i < checkout.paymentMethodsResponse.storedPaymentMethods.length; i++) {
                paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];

                if (paymentMethod.supportedShopperInteractions.includes('Ecommerce')) {
                  renderPaymentMethod(paymentMethod, true, paymentMethodsResponse.ImagePath);
                }
              }
            }

            paymentMethods.paymentMethods.forEach(function (pm) {
              !isMethodTypeBlocked(pm.type) && renderPaymentMethod(pm, false, paymentMethodsResponse.ImagePath);
            });
            firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
            firstPaymentMethod.checked = true;
            displaySelectedMethod(firstPaymentMethod.value);

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _renderGenericComponent.apply(this, arguments);
}

function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path) {
  var paymentMethodsUI = document.querySelector('#paymentMethodsList');
  var li = document.createElement('li');
  var paymentMethodID = storedPaymentMethodBool ? "storedCard".concat(paymentMethod.id) : paymentMethod.type;
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
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee(event) {
      return _regenerator["default"].wrap(function _callee$(_context) {
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

  if (componentsObj[paymentMethodID] && !container.childNodes[0] && ['bcmc', 'scheme'].indexOf(paymentMethodID) === -1) {
    componentsObj[paymentMethodID].isValid = true;
  }
}

function renderCheckoutComponent(storedPaymentMethodBool, checkout, paymentMethod, container, paymentMethodID) {
  if (storedPaymentMethodBool) {
    return createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID);
  }

  var fallback = getFallback(paymentMethod.type);

  if (fallback) {
    var template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
    return;
  }

  return createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID);
}

function createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID) {
  try {
    var node = checkout.create(paymentMethod.type, paymentMethod);

    if (!componentsObj[paymentMethodID]) {
      componentsObj[paymentMethodID] = {};
    }

    componentsObj[paymentMethodID].node = node;
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
  }).fail(function ()
  /* xhr, textStatus */
  {});
}

$('#dwfrm_billing').submit(function (e) {
  if (['paypal', 'mbway'].concat(qrCodeMethods).indexOf(selectedMethod) > -1 && !document.querySelector('#paymentFromComponentStateData').value) {
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
    onAdditionalDetails: function onAdditionalDetails(state
    /* , component */
    ) {
      document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(state.data);
      $('#dwfrm_billing').trigger('submit');
    }
  };
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