/* eslint-disable global-require */
let validatePayment;
let currentBasket;
let req;

beforeEach(() => {
  validatePayment = require('../validatePayment');
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  req = {
    geolocation: 'mockedLocation',
    currentCustomer: { raw: 'mockedCurrentCustomer' },
  };
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});

describe('validatePayment', () => {
  it('should not return error if payment method is gift certificate', () => {
    const {
      equals,
    } = require('dw/order/PaymentInstrument').METHOD_GIFT_CERTIFICATE;
    equals.mockImplementation(() => true);
    const validatePaymentResult = validatePayment(req, currentBasket);
    expect(validatePaymentResult.error).toBeFalsy();
  });

  it('should not return error if payment method is an applicable credit card', () => {
    const { equals } = require('dw/order/PaymentInstrument').METHOD_CREDIT_CARD;
    equals.mockImplementation(() => true);
    const validatePaymentResult = validatePayment(req, currentBasket);
    expect(validatePaymentResult.error).toBeFalsy();
  });

  it('should not return error if payment method is a credit card and there is a credit card token set.', () => {
    const { equals } = require('dw/order/PaymentInstrument').METHOD_CREDIT_CARD;
    equals.mockImplementation(() => true);
    const { getPaymentCard } = require('dw/order/PaymentMgr');
    getPaymentCard.mockImplementation(() => false);
    const validatePaymentResult = validatePayment(req, currentBasket);
    expect(validatePaymentResult.error).toBeFalsy();
  });

  it('should return error if payment method is an inapplicable credit card and there is no credit card token set.', () => {
    const { equals } = require('dw/order/PaymentInstrument').METHOD_CREDIT_CARD;
    equals.mockImplementation(() => true);
    const { getPaymentCard } = require('dw/order/PaymentMgr');
    getPaymentCard.mockImplementation(() => false);
    const { getCreditCardToken } = require('dw/order/BasketMgr');
    getCreditCardToken.mockImplementation(() => false);
    const validatePaymentResult = validatePayment(req, currentBasket);
    expect(validatePaymentResult.error).toBeTruthy();
  });
});
