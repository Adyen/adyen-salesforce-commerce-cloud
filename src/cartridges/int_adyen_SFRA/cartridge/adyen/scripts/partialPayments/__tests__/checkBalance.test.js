/* eslint-disable global-require */
jest.mock('dw/value/Money', () =>
  jest.fn().mockImplementation((value, currency) => ({
    value,
    currency,
    divide: jest.fn().mockReturnThis(),
    toFormattedString: jest.fn(() => `${currency} ${value}`),
  })),
);

jest.mock(
  '*/cartridge/adyen/utils/adyenHelper',
  () => ({
    getDivisorForCurrency: jest.fn(() => 100),
    getCurrencyValueForApi: jest.fn(() => ({ value: 25000 })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenCheckout',
  () => ({ doCheckBalanceCall: jest.fn() }),
  { virtual: true },
);

const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const checkBalance = require('../checkBalance');

const BALANCE = { currency: 'USD', value: 5000 };

let res;
let req;
let currentBasket;
let sessionWrite;

beforeEach(() => {
  jest.clearAllMocks();
  req = { form: { data: JSON.stringify({ paymentMethod: 'givex' }) } };
  res = { redirect: jest.fn(), json: jest.fn() };

  currentBasket = {
    currencyCode: 'USD',
    getTotalGrossPrice: jest.fn(() => ({
      currencyCode: 'USD',
      isAvailable: jest.fn(() => true),
    })),
    custom: {},
  };
  BasketMgr.getCurrentBasket.mockReturnValue(currentBasket);
  adyenCheckout.doCheckBalanceCall.mockReturnValue({
    resultCode: 'Success',
    balance: BALANCE,
  });

  sessionWrite = jest.fn();
  Object.defineProperty(session.privacy, 'giftCardBalance', {
    configurable: true,
    get: () => undefined,
    set: sessionWrite,
  });
});

afterEach(() => {
  delete session.privacy.giftCardBalance;
});

describe('check balance', () => {
  it('should store the gift card balance on the basket in a transaction', () => {
    checkBalance(req, res, jest.fn());

    expect(Transaction.wrap).toHaveBeenCalled();
    expect(JSON.parse(currentBasket.custom.adyenGiftCardBalance)).toEqual(
      BALANCE,
    );
    expect(currentBasket.custom.adyenGiftCardsOrderNo).toBe('mocked_orderNo');
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it('should not store the gift card balance in the session', () => {
    checkBalance(req, res, jest.fn());

    expect(sessionWrite).not.toHaveBeenCalled();
  });

  it('should send successful response', () => {
    checkBalance(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      resultCode: 'Success',
      balance: BALANCE,
      remainingAmountFormatted: 'USD 0',
      totalAmountFormatted: 'USD 25000',
    });
  });
});
