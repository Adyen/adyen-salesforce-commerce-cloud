jest.mock('../utils/index', () => ({
  validatePaymentMethod: jest.fn(() => jest.fn(() => true)),
}));
/* eslint-disable global-require */
let handlePayments;
let validatePayment;
let order;
let orderNumber;
let currentBasket;
let req;

beforeEach(() => {
  jest.clearAllMocks();

  handlePayments = require('../adyenHelpers').handlePayments;
  validatePayment = require('../adyenHelpers').validatePayment;
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  req = {
    geolocation: 'mockedLocation',
    currentCustomer: { raw: 'mockedCurrentCustomer' },
  };
  order = {
    totalNetPrice: 10,
    paymentInstruments: ['item0', 'item1'],
  };
  orderNumber = 'mockedOrderNumber';
});

afterEach(() => {
  jest.resetModules();
});

describe('Adyen Helpers', () => {
  describe('Handle Payments', () => {
    it('should return when totalNetPrice is 0.0', () => {
      order.totalNetPrice = 0.0;
      const handlePaymentsResult = handlePayments(order, orderNumber);
      expect(handlePaymentsResult).toEqual({});
    });

    it('should return error if there are no paymentInstruments', () => {
      order.paymentInstruments = [];
      const handlePaymentsResult = handlePayments(order, orderNumber);
      expect(handlePaymentsResult.error).toBeTruthy();
    });
  });
  describe('Validate Payment', () => {
    it('should return error', () => {
      const { validatePaymentMethod } = require('../utils/index');
      validatePaymentMethod.mockImplementation(() => jest.fn(() => false));
      const validatePaymentResult = validatePayment(req, currentBasket);
      expect(validatePaymentResult.error).toBeTruthy();
    });

    it('should be valid', () => {
      const validatePaymentResult = validatePayment(req, currentBasket);
      expect(validatePaymentResult.error).toBeFalsy();
    });
  });
});
