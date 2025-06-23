/* eslint-disable global-require */
let authorize;
let order;
let paymentInstrument;

beforeEach(() => {
  authorize = require('../authorize');
  jest.clearAllMocks();
  const OrderMgr = require('dw/order/OrderMgr');
  order = OrderMgr.getOrder('15');
  order.getOrderNo = jest.fn().mockReturnValue('15');
  order.getOrderToken = jest.fn().mockReturnValue('12341234');
  paymentInstrument = order.getPaymentInstruments()[0];
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
      order,
      paymentInstrument,
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
    const authorizeResult = authorize(
      order, // Pass the order number string
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
      fullResponse: { action: 'mockedAction' },
    }));
    const authorizeResult = authorize(
      order, // Pass the order number string
      paymentInstrument,
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
    const authorizeResult = authorize(
      order,
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
      order,
      paymentInstrument,
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
      order,
      paymentInstrument,
      'mockedPaymentProcessor',
    );
    expect(authorizeResult).toMatchSnapshot();
  });
});