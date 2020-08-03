/* eslint-disable global-require */
let authorize;
let currentBasket;

beforeEach(() => {
  authorize = require('../authorize');
  jest.clearAllMocks();
  const { getCurrentBasket } = require('dw/order/BasketMgr');
  currentBasket = getCurrentBasket();
});

afterEach(() => {
  jest.resetModules();
});

describe('adyen component authorize function', () => {
  it('return with appropriate mesages when create payment request fails', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      error: {},
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('handle the create payment request result 3DS', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      resultCode: 'RedirectShopper',
      redirectObject: {
        data: {
          MD: 'mockedMD',
        },
      },
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('handle the create payment request result 3DS2', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      threeDS2: 'mockedthreeDS2',
      resultCode: 'mockedresultCode',
      token3ds2: 'mockedtoken3ds2',
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('handle the create payment request result redirectShopper', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      resultCode: 'RedirectShopper',
      redirectObject: {
        url: 'mockedURL',
      },
      paymentData: 'mockedpaymentData',
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('handle the create payment request decision accept', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      decision: 'ACCEPT',
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });

  it('handle create payment request decisions other than accept', () => {
    const { createPaymentRequest } = require('*/cartridge/scripts/adyenCheckout');
    createPaymentRequest.mockImplementation(() => ({
      decision: "DON'T ACCEPT",
    }));
    const authorizeResult = authorize(
      '15',
      currentBasket.createPaymentInstrument(),
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });
});
