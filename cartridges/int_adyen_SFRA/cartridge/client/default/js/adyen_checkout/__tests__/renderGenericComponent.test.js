"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('../renderGenericComponent'),
    renderGenericComponent = _require.renderGenericComponent;

var store = require('../../../../../store');

beforeEach(function () {
  window.AdyenCheckout = jest.fn(function () {});
  window.Configuration = {
    amount: 0
  };
  window.sessionsUrl = "Adyen-Sessions";
});
describe('Render Generic Component', function () {
  it('should call sessions', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            $.ajax = jest.fn();
            store.componentsObj = {
              foo: 'bar',
              bar: 'baz'
            };
            _context.next = 4;
            return renderGenericComponent();

          case 4:
            expect($.ajax).toBeCalledWith({
              url: 'Adyen-Sessions',
              type: 'get',
              success: expect.any(Function)
            });

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })));
  it('should render', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
    var mockedSuccessResponse;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            document.body.innerHTML = "\n      <div id=\"paymentMethodsList\"></div>\n      <input type=\"radio\" name=\"brandCode\" value=\"card\" />\n      <button value=\"submit-payment\">Submit</button>\n      <div id=\"component_card\"></div>\n      <div id=\"adyenPosTerminals\">\n        <span>Child #1</span>\n      </div>\n      <div>\n        <input type=\"text\" id=\"shippingFirstNamedefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingLastNamedefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingAddressOnedefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingAddressCitydefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingZipCodedefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingCountrydefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingPhoneNumberdefault\" value=\"test\">\n        <input type=\"text\" id=\"shippingZipCodedefault\" value=\"test\">  \n      </div>\n    ";
            window.AdyenCheckout = jest.fn( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
              return _regenerator["default"].wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      return _context2.abrupt("return", {
                        create: jest.fn(),
                        paymentMethodsResponse: {
                          storedPaymentMethods: [{
                            supportedShopperInteractions: ['Ecommerce']
                          }],
                          paymentMethods: [{
                            type: 'amazonpay'
                          }]
                        },
                        options: {
                          amount: 'mocked_amount',
                          countryCode: 'mocked_countrycode'
                        }
                      });

                    case 1:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2);
            })));
            mockedSuccessResponse = {
              adyenConnectedTerminals: {
                uniqueTerminalIds: ['mocked_id']
              },
              id: 'mock_id',
              sessionData: 'mock_session_data',
              imagePath: 'example.com'
            };
            $.ajax = jest.fn(function (_ref4) {
              var success = _ref4.success;
              return success(mockedSuccessResponse);
            });
            store.componentsObj = {
              foo: 'bar',
              bar: 'baz'
            };
            store.checkoutConfiguration.paymentMethodsConfiguration = {
              amazonpay: {}
            };
            _context3.next = 8;
            return renderGenericComponent();

          case 8:
            expect(store.checkoutConfiguration).toMatchSnapshot();
            expect(document.querySelector('input[type=radio][name=brandCode]').value).toBeTruthy();

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  })));
});