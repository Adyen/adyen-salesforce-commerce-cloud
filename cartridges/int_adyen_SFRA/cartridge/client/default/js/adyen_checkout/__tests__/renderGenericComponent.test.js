"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('../renderGenericComponent'),
    renderGenericComponent = _require.renderGenericComponent;

var store = require('../../../../../store');

beforeEach(function () {
  window.AdyenCheckout = jest.fn();
  window.Configuration = {
    amount: 0
  };
  window.getPaymentMethodsURL = "Adyen-GetPaymentMethods";
});
describe('Render Generic Component', function () {
  it('should call getPaymentMethods', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
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
              url: 'Adyen-GetPaymentMethods',
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
  it('should render', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var mockedSuccessResponse;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            document.body.innerHTML = "\n      <div id=\"paymentMethodsList\"></div>\n      <input type=\"radio\" name=\"brandCode\" value=\"card\" />\n      <button value=\"submit-payment\">Submit</button>\n      <div id=\"component_card\"></div>\n      <div id=\"adyenPosTerminals\">\n        <span>Child #1</span>\n      </div>\n    ";
            window.AdyenCheckout = jest.fn(function () {
              return {
                create: jest.fn(),
                paymentMethodsResponse: {
                  storedPaymentMethods: [{
                    supportedShopperInteractions: ['Ecommerce']
                  }]
                }
              };
            });
            mockedSuccessResponse = {
              amount: 'mocked_amount',
              countryCode: 'mocked_country',
              AdyenConnectedTerminals: {
                uniqueTerminalIds: ['mocked_id']
              },
              AdyenPaymentMethods: {
                paymentMethods: [{
                  type: 'scheme',
                  name: 'Card'
                }],
                storedPaymentMethods: true
              },
              ImagePath: 'example.com',
              AdyenDescriptions: [{
                description: 'mocked_description'
              }]
            };
            $.ajax = jest.fn(function (_ref3) {
              var success = _ref3.success;
              return success(mockedSuccessResponse);
            });
            store.componentsObj = {
              foo: 'bar',
              bar: 'baz'
            };
            _context2.next = 7;
            return renderGenericComponent();

          case 7:
            expect(store.checkoutConfiguration).toMatchSnapshot();
            expect(document.querySelector('input[type=radio][name=brandCode]').value).toBeTruthy();

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  })));
});