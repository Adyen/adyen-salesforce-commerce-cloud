"use strict";

/* eslint-disable global-require */
var posAuthorize;
var orderNumber;
var paymentInstrument;
var paymentProcessor;
var Logger;
beforeEach(function () {
  posAuthorize = require('../posAuthorize');
  orderNumber = 'mockedNum';
  paymentInstrument = {
    paymentTransaction: {}
  };
  paymentProcessor = 'mockedPaymentProcessor';
  Logger = require('dw/system/Logger');
  jest.clearAllMocks();
});
afterEach(function () {
  jest.resetModules();
});
describe('POS Authorize', function () {
  it('should return error if there is no terminal ID', function () {
    var getForm = require('server').forms.getForm;
    getForm.mockImplementation(function () {
      return {
        adyenPaymentFields: {
          terminalId: {
            value: null
          }
        }
      };
    });
    var authorizeResult = posAuthorize(orderNumber, paymentInstrument, paymentProcessor);
    expect(authorizeResult).toMatchSnapshot();
    expect(Logger.fatal.mock.calls).toMatchSnapshot();
  });
  it('should return error if createTerminalPayment fails', function () {
    var _require = require('*/cartridge/scripts/adyenTerminalApi'),
      createTerminalPayment = _require.createTerminalPayment;
    createTerminalPayment.mockImplementation(function () {
      return {
        error: true,
        response: 'mockedResponse'
      };
    });
    var authorizeResult = posAuthorize(orderNumber, paymentInstrument, paymentProcessor);
    expect(authorizeResult).toMatchSnapshot();
    expect(Logger.fatal.mock.calls).toMatchSnapshot();
  });
  it('should return success response when createTerminalPayment passes', function () {
    var authorizeResult = posAuthorize(orderNumber, paymentInstrument, paymentProcessor);
    expect(authorizeResult).toMatchSnapshot();
  });
});