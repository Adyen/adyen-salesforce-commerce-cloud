/**
 * @jest-environment jsdom
 */
const { makePartialPayment } = require('../makePartialPayment');
const store = require('../../../../../store');
let data;

beforeEach( () => {
    store.checkout = {
     options: {amount: 100}
    };
    data = {
      paymentMethod: 'giftCardData',
      amount: '10',
      partialPaymentsOrder: {
        pspReference: 'store.adyenOrderData.pspReference',
        orderData: 'store.adyenOrderData.orderData',
      },
      giftCards : 'visa',
  };
  });

  afterEach(() => {
    jest.resetModules();
  });

describe('Make partial payment request', () => {
  it.skip('should make partial payment', async () => {
    $.ajax = jest.fn(({ success }) => {
      success(data);
      return { fail: jest.fn() };
    });
    makePartialPayment(data);
    expect(store.addedGiftCards).toBe(data.giftCards);
    expect(store.adyenOrderData).toBe(data.partialPaymentsOrder);
  });

  it('should handle partial payment with error', () => {
    const responseData = { error: true };
    $.ajax = jest.fn(({ success }) => {
      success(responseData);
      return { fail: jest.fn() };
    });
    const result = makePartialPayment(data);
    expect(result).toEqual({ error: true });
  });

  it('should fail to make partial payment', () => {
    $.ajax = jest.fn(({ success }) => {
      success({});
      return { fail: jest.fn() };
    });  
    const result = makePartialPayment(data);
    expect(store.addedGiftCards).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
