/* eslint-disable global-require */
let posAuthorize;
let orderNumber;
let paymentInstrument;
let paymentProcessor;
let AdyenLogs

beforeEach(() => {
  AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
  posAuthorize = require('../posAuthorize');
  orderNumber = 'mockedNum';
  paymentInstrument = {
    paymentTransaction: {},
  };
  paymentProcessor = 'mockedPaymentProcessor';
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});

describe('POS Authorize', () => {
  it('should return error if there is no terminal ID', () => {
    const { getForm } = require('server').forms;
    getForm.mockImplementation(() => ({
      adyenPaymentFields: {
        terminalId: { value: null },
      },
    }));

    const authorizeResult = posAuthorize(
      orderNumber,
      paymentInstrument,
      paymentProcessor,
    );
    expect(authorizeResult).toMatchSnapshot();
    expect(AdyenLogs.fatal_log).toHaveBeenCalled();
  });

  it('should return error if createTerminalPayment fails', () => {
    const {
      createTerminalPayment,
    } = require('*/cartridge/adyen/scripts/payments/adyenTerminalApi');
    const mockError = new Error('API error');
    createTerminalPayment.mockImplementation(() => {
		throw mockError;
    });
    const authorizeResult = posAuthorize(
      orderNumber,
      paymentInstrument,
      paymentProcessor,
    );
    expect(AdyenLogs.fatal_log).toHaveBeenCalled();
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should return success response when createTerminalPayment passes', () => {
    const authorizeResult = posAuthorize(
      orderNumber,
      paymentInstrument,
      paymentProcessor,
    );
    expect(authorizeResult).toMatchSnapshot();
  });
});
