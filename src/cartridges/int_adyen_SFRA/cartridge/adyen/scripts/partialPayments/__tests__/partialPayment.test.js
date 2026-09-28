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
    executeCall: jest.fn(),
    getDivisorForCurrency: jest.fn(),
    getCurrencyValueForApi: jest.fn(),
  }),
  { virtual: true },
);

const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const makePartialPayment = require('../partialPayment');

const SESSION_FIELDS = [
  'giftCardResponse',
  'partialPaymentAmounts',
  'giftCardBalance',
];

const ORDER_AMOUNT = 250000;
const GIFT_CARD_BALANCE = 5000;

let res;
let req;
let currentBasket;
let sessionWrites;

// The orderData blob Adyen returns grows with every gift card added to the order
function createOrderData(sequence) {
  return `Ab02b4c0!BQABAgB${'A1b2C3d4E5f6G7h8I9j0'.repeat(45 + sequence * 15)}`;
}

function createBasket() {
  return {
    currencyCode: 'USD',
    getTotalGrossPrice: jest.fn(() => ({
      value: ORDER_AMOUNT,
      currencyCode: 'USD',
      isAvailable: jest.fn(() => true),
    })),
    custom: {
      adyenGiftCardsOrderNo: 'mocked_giftCardsOrderNo',
      adyenGiftCardBalance: JSON.stringify({
        currency: 'USD',
        value: GIFT_CARD_BALANCE,
      }),
      partialPaymentOrderData: JSON.stringify({
        order: {
          orderData: createOrderData(0),
          pspReference: 'mocked_orderPspReference_0',
        },
        remainingAmount: { currency: 'USD', value: ORDER_AMOUNT },
        amount: { currency: 'USD', value: ORDER_AMOUNT },
      }),
    },
  };
}

function addGiftCards(amount) {
  let remainingAmount = JSON.parse(currentBasket.custom.partialPaymentOrderData)
    .remainingAmount.value;

  for (let sequence = 1; sequence <= amount; sequence += 1) {
    remainingAmount -= GIFT_CARD_BALANCE;
    AdyenHelper.executeCall.mockReturnValueOnce({
      resultCode: 'Authorised',
      pspReference: `mocked_pspReference_${sequence}`,
      amount: { currency: 'USD', value: GIFT_CARD_BALANCE },
      paymentMethod: { type: 'giftcard', brand: 'givex' },
      order: {
        orderData: createOrderData(sequence),
        pspReference: `mocked_orderPspReference_${sequence}`,
        remainingAmount: { currency: 'USD', value: remainingAmount },
        expiresAt: '2100-01-01T00:00:00Z',
      },
    });
    makePartialPayment(req, res, jest.fn());
  }

  return remainingAmount;
}

beforeEach(() => {
  jest.clearAllMocks();

  req = {
    form: {
      data: JSON.stringify({
        encryptedCardNumber: 'mocked_encryptedCardNumber',
        encryptedSecurityCode: 'mocked_encryptedSecurityCode',
        brand: 'givex',
        giftCardBrand: 'Givex',
      }),
    },
  };
  res = { redirect: jest.fn(), json: jest.fn() };

  currentBasket = createBasket();
  BasketMgr.getCurrentBasket.mockReturnValue(currentBasket);
  AdyenHelper.getDivisorForCurrency.mockReturnValue(100);
  AdyenHelper.getCurrencyValueForApi.mockReturnValue({ value: ORDER_AMOUNT });

  // session.privacy writes have a platform string length quota, so track them
  sessionWrites = {};
  SESSION_FIELDS.forEach((field) => {
    sessionWrites[field] = jest.fn();
    Object.defineProperty(session.privacy, field, {
      configurable: true,
      get: () => undefined,
      set: sessionWrites[field],
    });
  });
});

afterEach(() => {
  SESSION_FIELDS.forEach((field) => {
    delete session.privacy[field];
  });
});

describe('partial payment', () => {
  it('should send the gift card balance stored on the basket', () => {
    addGiftCards(1);

    expect(AdyenHelper.executeCall).toHaveBeenCalledWith(
      'AdyenPayment',
      expect.objectContaining({
        amount: { currency: 'USD', value: GIFT_CARD_BALANCE },
        reference: 'mocked_giftCardsOrderNo',
        order: {
          orderData: createOrderData(0),
          pspReference: 'mocked_orderPspReference_0',
        },
      }),
    );
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it.each([5, 30])(
    'should never write to session.privacy for %i gift cards',
    (numberOfGiftCards) => {
      addGiftCards(numberOfGiftCards);

      expect(AdyenLogs.error_log).not.toHaveBeenCalled();
      SESSION_FIELDS.forEach((field) => {
        expect(sessionWrites[field]).not.toHaveBeenCalled();
      });
    },
  );

  it.each([5, 30])(
    'should keep the remaining amount on the basket for %i gift cards',
    (numberOfGiftCards) => {
      const remainingAmount = addGiftCards(numberOfGiftCards);

      const partialPaymentOrderData = JSON.parse(
        currentBasket.custom.partialPaymentOrderData,
      );
      expect(partialPaymentOrderData.remainingAmount).toEqual({
        currency: 'USD',
        value: remainingAmount,
      });
      expect(partialPaymentOrderData.amount).toEqual({
        currency: 'USD',
        value: ORDER_AMOUNT,
      });
      expect(partialPaymentOrderData.order).toEqual({
        orderData: createOrderData(numberOfGiftCards),
        pspReference: `mocked_orderPspReference_${numberOfGiftCards}`,
      });
      // the payload the session quota used to truncate
      expect(
        currentBasket.custom.partialPaymentOrderData.length,
      ).toBeGreaterThan(2000);
    },
  );

  it.each([5, 30])(
    'should store %i gift cards on the basket',
    (numberOfGiftCards) => {
      addGiftCards(numberOfGiftCards);

      const addedGiftCards = JSON.parse(currentBasket.custom.adyenGiftCards);
      expect(addedGiftCards).toHaveLength(numberOfGiftCards);
      addedGiftCards.forEach((addedGiftCard, index) => {
        expect(addedGiftCard.giftCard).toEqual({
          type: 'giftcard',
          brand: 'givex',
          name: 'Givex',
          amount: { currency: 'USD', value: GIFT_CARD_BALANCE },
          pspReference: `mocked_pspReference_${index + 1}`,
        });
        expect(addedGiftCard.remainingAmount).toEqual({
          currency: 'USD',
          value: ORDER_AMOUNT - GIFT_CARD_BALANCE * (index + 1),
        });
        expect(addedGiftCard.orderCreated).toBe(true);
      });
    },
  );

  it('should leave the gift card balance on the basket untouched', () => {
    addGiftCards(5);

    expect(JSON.parse(currentBasket.custom.adyenGiftCardBalance)).toEqual({
      currency: 'USD',
      value: GIFT_CARD_BALANCE,
    });
  });

  it('should keep the response contract intact', () => {
    const remainingAmount = addGiftCards(5);

    expect(res.json).toHaveBeenCalledTimes(5);
    expect(res.json).toHaveBeenLastCalledWith(
      expect.objectContaining({
        discountedAmount: `USD ${GIFT_CARD_BALANCE}`,
        expiresAt: '2100-01-01T00:00:00Z',
        orderAmount: { currency: 'USD', value: ORDER_AMOUNT },
        orderCreated: true,
        remainingAmount: { currency: 'USD', value: remainingAmount },
        remainingAmountFormatted: `USD ${remainingAmount}`,
        totalDiscountedAmount: `USD ${GIFT_CARD_BALANCE * 5}`,
        giftCards: JSON.parse(currentBasket.custom.adyenGiftCards),
        message: 'mocked_infoMessage.giftCard',
      }),
    );
  });

  it('should fail with an AdyenError when no partial payment order exists', () => {
    currentBasket.custom.partialPaymentOrderData = null;

    makePartialPayment(req, res, jest.fn());

    expect(AdyenHelper.executeCall).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      errorType: 'AdyenError',
    });
    expect(AdyenLogs.error_log).toHaveBeenCalledWith(
      'Failed to create partial payment:',
      expect.objectContaining({
        message: 'No partial payment order data found',
      }),
    );
  });

  it('should not update the basket when the payment is refused', () => {
    const partialPaymentOrderData =
      currentBasket.custom.partialPaymentOrderData;
    AdyenHelper.executeCall.mockReturnValueOnce({ resultCode: 'Refused' });

    makePartialPayment(req, res, jest.fn());

    expect(currentBasket.custom.partialPaymentOrderData).toBe(
      partialPaymentOrderData,
    );
    expect(currentBasket.custom.adyenGiftCards).toBeUndefined();
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      errorType: 'AdyenError',
    });
    expect(AdyenLogs.error_log).toHaveBeenCalled();
  });
});
