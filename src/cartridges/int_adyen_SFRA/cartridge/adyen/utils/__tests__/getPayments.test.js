/* eslint-disable global-require */
let getPayments;
let order;
let orderNumber;
let setTransactionID;

beforeEach(() => {
  getPayments = require('../getPayments');
  setTransactionID = jest.fn(() => true);
  const toArray = jest.fn(() => [
    {
      ID: 'mockedPaymentInstrument',
      paymentTransaction: { setTransactionID },
    },
  ]);
  order = {
    totalNetPrice: 10,
    paymentInstruments: { toArray },
  };
  orderNumber = 'mockedOrderNumber';
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});

describe('Get Payments', () => {
  it('should setTransactionID when there is no payment processor', () => {
    const { getPaymentMethod } = require('dw/order/PaymentMgr');
    getPaymentMethod.mockImplementation(() => ({
      paymentProcessor: null,
    }));
    getPayments(order, orderNumber);
    expect(setTransactionID).toBeCalledTimes(1);
  });

  it('should return error when authorization result returns an error', () => {
    const { callHook } = require('dw/system/HookMgr');
    callHook.mockImplementation(() => ({
      error: true,
    }));
    const handlePaymentsResult = getPayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeTruthy();
  });

  it('should not return error when authorization result does not return an error', () => {
    const handlePaymentsResult = getPayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeFalsy();
  });
});
