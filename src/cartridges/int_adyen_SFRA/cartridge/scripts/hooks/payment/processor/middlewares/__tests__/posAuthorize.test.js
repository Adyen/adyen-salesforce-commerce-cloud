/* eslint-disable global-require */
let posAuthorize;
let orderNumber;
let paymentInstrument;
let paymentProcessor;
let Logger;

beforeEach(() => {
  posAuthorize = require('../posAuthorize');
  orderNumber = 'mockedNum';
  paymentInstrument = {
    paymentTransaction: {},
  };
  paymentProcessor = 'mockedPaymentProcessor';
  Logger = require('dw/system/Logger');
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
    expect(Logger.fatal.mock.calls).toMatchSnapshot();
  });

  it('should return error if createTerminalPayment fails', () => {
    const {
      createTerminalPayment,
    } = require('*/cartridge/scripts/adyenTerminalApi');
    createTerminalPayment.mockImplementation(() => ({
      error: true,
      response: 'mockedResponse',
    }));

    const authorizeResult = posAuthorize(
      orderNumber,
      paymentInstrument,
      paymentProcessor,
    );
    expect(authorizeResult).toMatchSnapshot();
    expect(Logger.fatal.mock.calls).toMatchSnapshot();
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
