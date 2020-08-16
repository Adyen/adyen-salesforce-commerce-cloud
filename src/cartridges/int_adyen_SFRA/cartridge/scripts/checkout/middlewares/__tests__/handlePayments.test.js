/* eslint-disable global-require */
let handlePayments;
let order;
let orderNumber;

beforeEach(() => {
  handlePayments = require('../handlePayments');
  order = {
    totalNetPrice: 10,
    paymentInstruments: [
      {
        ID: 'mockedPaymentInstrument',
        paymentTransaction: { setTransactionID: jest.fn((orderNo) => true) },
      },
    ],
  };
  orderNumber = 'mockedOrderNumber';
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});

describe('handlePayments', () => {
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

  it('should setTransactionID when there is no payment processor', () => {
    const { getPaymentMethod } = require('dw/order/PaymentMgr');
    getPaymentMethod.mockImplementation(() => ({
      paymentProcessor: null,
    }));
    handlePayments(order, orderNumber);
    expect(
      order.paymentInstruments[0].paymentTransaction.setTransactionID,
    ).toBeCalledTimes(1);
  });

  it('should return error when authorization result returns an error', () => {
    const { callHook } = require('dw/system/HookMgr');
    callHook.mockImplementation(() => ({
      error: true,
    }));
    const handlePaymentsResult = handlePayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeTruthy();
  });

  it('should not return error when authorization result does not return an error', () => {
    const handlePaymentsResult = handlePayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeFalsy();
  });
});
