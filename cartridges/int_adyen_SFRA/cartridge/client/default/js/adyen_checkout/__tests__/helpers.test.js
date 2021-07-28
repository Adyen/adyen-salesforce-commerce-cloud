"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('../helpers'),
    paymentFromComponent = _require.paymentFromComponent;

var component;
beforeEach(function () {
  component = {
    handleAction: jest.fn(),
    setStatus: jest.fn(),
    reject: jest.fn()
  };
});
describe('Helpers', function () {
  it('should make payment ajax call with fullResponse', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var data;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            document.body.innerHTML = "\n        <div id=\"adyenPaymentMethodName\"></div>\n        <form id=\"showConfirmationForm\"></form>\n      ";
            data = {
              fullResponse: {
                action: 'mocked_action'
              },
              paymentMethod: 'mocked_paymentMethod'
            };
            $.ajax = jest.fn(function (_ref2) {
              var success = _ref2.success;
              success(data);
              return {
                fail: jest.fn()
              };
            });
            _context.next = 5;
            return paymentFromComponent(data, component);

          case 5:
            expect(component.handleAction).toBeCalledWith(data.fullResponse.action);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })));
  it('  should make payment ajax call that fails', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var data;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            document.body.innerHTML = "\n        <div id=\"adyenPaymentMethodName\"></div>\n        <form id=\"showConfirmationForm\"></form>\n      ";
            window.HTMLFormElement.prototype.submit = jest.fn();
            data = {
              data: {},
              paymentMethod: 'mocked_paymentMethod'
            };
            $.ajax = jest.fn(function (_ref4) {
              var success = _ref4.success;
              success({});
              return {
                fail: jest.fn()
              };
            });
            _context2.next = 6;
            return paymentFromComponent(data, component);

          case 6:
            expect(data).toMatchSnapshot();

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  })));
});