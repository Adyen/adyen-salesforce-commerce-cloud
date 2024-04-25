/* eslint-disable global-require */
let authorize;
let currentBasket;

beforeEach(() => {
  authorize = require('../authorize');
  jest.clearAllMocks();
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
});

afterEach(() => {
  jest.resetModules();
});

describe('Authorize', () => {
  it('should return when create payment request fails', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      error: {},
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.toArray()[0],
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should authorize 3DS payments', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      resultCode: 'RedirectShopper',
      redirectObject: {
        url: 'mockedUrl',
        data: {
          MD: 'mockedMD',
        },
      },
    }));
    const paymentInstrument = currentBasket.toArray()[0];
    const authorizeResult = authorize(
      '15',
      paymentInstrument,
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should authorize 3DS2 payments', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      threeDS2: 'mockedthreeDS2',
      resultCode: 'mockedresultCode',
      fullResponse: {action: 'mockedAction'},
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.toArray()[0],
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should authorize redirectShopper payments', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      resultCode: 'RedirectShopper',
      redirectObject: {
        url: 'mockedURL',
      },
      paymentData: 'mockedpaymentData',
    }));
    const paymentInstrument = currentBasket.toArray()[0];
    const authorizeResult = authorize(
      '15',
      paymentInstrument,
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should handle the create payment request decision accept', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      decision: 'ACCEPT',
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.toArray()[0],
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('should handle create payment request decisions other than accept', () => {
    const {
      createPaymentRequest,
    } = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      decision: "DON'T ACCEPT",
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.toArray()[0],
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });
});
