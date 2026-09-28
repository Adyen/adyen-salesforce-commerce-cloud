/* eslint-disable global-require */
jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenCheckout',
  () => ({
    doCancelPartialPaymentOrderCall: jest.fn(() => ({
      resultCode: 'Received',
    })),
  }),
  { virtual: true },
);

const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const cancelPartialPaymentOrder = require('../cancelPartialPaymentOrder');

let res;
let req;
let currentBasket;
let giftCardPaymentInstrument;

beforeEach(() => {
  jest.clearAllMocks();
  req = { form: { data: JSON.stringify({ paymentMethod: 'givex' }) } };
  res = { redirect: jest.fn(), json: jest.fn() };

  giftCardPaymentInstrument = {
    custom: { adyenPartialPaymentsOrder: '{"order":{}}' },
  };
  currentBasket = {
    currencyCode: 'USD',
    getTotalGrossPrice: jest.fn(() => ({
      currencyCode: 'USD',
      isAvailable: jest.fn(() => true),
    })),
    getPaymentInstruments: jest.fn(() => ({
      toArray: jest.fn(() => [giftCardPaymentInstrument]),
    })),
    removePaymentInstrument: jest.fn(),
    custom: {
      adyenGiftCards: '[{"giftCard":{}}]',
      adyenGiftCardsOrderNo: 'mocked_giftCardsOrderNo',
      adyenGiftCardBalance: '{"currency":"USD","value":5000}',
      partialPaymentOrderData:
        '{"order":{"orderData":"mocked_orderData","pspReference":"mocked_psp"}}',
    },
  };
  BasketMgr.getCurrentBasket.mockReturnValue(currentBasket);
});

describe('cancelPartialPaymentOrder', () => {
  it('should clear the gift card data from the basket', () => {
    cancelPartialPaymentOrder(req, res, jest.fn());

    expect(currentBasket.custom.adyenGiftCards).toBeNull();
    expect(currentBasket.custom.adyenGiftCardsOrderNo).toBeNull();
    expect(currentBasket.custom.adyenGiftCardBalance).toBeNull();
    expect(currentBasket.custom.partialPaymentOrderData).toBeNull();
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it('should remove the partial payment instruments', () => {
    cancelPartialPaymentOrder(req, res, jest.fn());

    expect(currentBasket.removePaymentInstrument).toHaveBeenCalledWith(
      giftCardPaymentInstrument,
    );
  });

  it('should send the cancelled order amount', () => {
    cancelPartialPaymentOrder(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      resultCode: 'Received',
      amount: { currency: 'USD', value: 1000 },
    });
  });
});
