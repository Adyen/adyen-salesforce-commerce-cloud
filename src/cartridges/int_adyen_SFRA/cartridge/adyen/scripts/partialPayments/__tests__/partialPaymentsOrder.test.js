/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const createPartialPaymentsOrder = require('../partialPaymentsOrder');

const ORDER_AMOUNT = 1000;

let res;
let req;
let currentBasket;
let sessionWrite;

beforeEach(() => {
  jest.clearAllMocks();
  res = { redirect: jest.fn(), json: jest.fn() };

  currentBasket = {
    currencyCode: 'EUR',
    getTotalGrossPrice: jest.fn(() => ({
      currencyCode: 'EUR',
      isAvailable: jest.fn(() => true),
    })),
    custom: { adyenGiftCardsOrderNo: 'mocked_giftCardsOrderNo' },
  };
  BasketMgr.getCurrentBasket.mockReturnValue(currentBasket);
  adyenCheckout.doCreatePartialPaymentOrderCall.mockReturnValue({
    resultCode: 'Success',
    orderData: 'mocked_orderData',
    pspReference: 'mocked_orderPspReference',
    remainingAmount: { currency: 'EUR', value: ORDER_AMOUNT },
  });

  sessionWrite = jest.fn();
  Object.defineProperty(session.privacy, 'partialPaymentAmounts', {
    configurable: true,
    get: () => undefined,
    set: sessionWrite,
  });
});

afterEach(() => {
  delete session.privacy.partialPaymentAmounts;
});

describe('partial payments order', () => {
  it('should cache order data on the basket to reuse at payments', () => {
    createPartialPaymentsOrder(req, res, jest.fn());

    expect(JSON.parse(currentBasket.custom.partialPaymentOrderData)).toEqual({
      order: {
        orderData: 'mocked_orderData',
        pspReference: 'mocked_orderPspReference',
      },
      remainingAmount: { currency: 'EUR', value: ORDER_AMOUNT },
      amount: { currency: 'EUR', value: ORDER_AMOUNT },
    });
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it('should not cache order data in the session', () => {
    createPartialPaymentsOrder(req, res, jest.fn());

    expect(sessionWrite).not.toHaveBeenCalled();
  });
});
