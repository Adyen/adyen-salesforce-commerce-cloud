/**
 * @jest-environment jsdom
 */
const { makePartialPayment } = require('../makePartialPayment');
const store = require('../../../../../store');
let data;
beforeEach(() => {
  store.checkout = {
    options: { amount: 100 },
  };
  data = {
    paymentMethod: {
      type: 'giftcard',
      brand: 'givex',
    },
    amount: {
      currency: 'USD',
      value: '50',
    },
    partialPaymentsOrder: {
      pspReference: 'store.adyenOrderData.pspReference',
      orderData: 'store.adyenOrderData.orderData',
    },
    giftcardBrand: 'Givex',
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Make partial payment request', () => {
  it('should make partial payment', async () => {
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback(data)),
      fail: jest.fn(),
    }));
    await makePartialPayment(data);
    expect(store.adyenOrderData).toEqual(data.partialPaymentsOrder);
  });

  it('should handle partial payment with error', async () => {
    const responseData = { error: true };
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback(responseData)),
      fail: jest.fn(),
    }));
    try {
      await makePartialPayment(data);
      fail();
    } catch (error) {
      expect(error.message).toBe('Partial payment error true');
    }  
  });

  it('should fail to make partial payment', async () => {
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback({})),
      fail: jest.fn(),
    }));
    await expect(makePartialPayment(data)).resolves.toBeUndefined();
    expect(store.addedGiftCards).toBeUndefined();
    expect(store.adyenOrderData).toBeUndefined();
  });
});
