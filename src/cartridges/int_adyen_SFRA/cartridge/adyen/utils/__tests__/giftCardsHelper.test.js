const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');
const giftCardsHelper = require('../giftCardsHelper');

jest.mock('dw/system/Transaction', () => ({
  wrap: jest.fn()
}));

jest.mock('dw/order/PaymentMgr', () => ({
  getPaymentMethod: jest.fn().mockReturnValue({
    paymentProcessor: 'mockProcessor',
  }),
}));

jest.mock('dw/value/Money', () => {
  return jest.fn().mockImplementation((value, currency) => ({
    divide: jest.fn().mockReturnValue({ value: value / 100, currency })
  }));
});

jest.mock('*/cartridge/adyen/utils/adyenHelper', () => ({
  setPaymentTransactionType: jest.fn(),
}));

describe('giftCardsHelper', () => {
  describe('createGiftCardPaymentInstrument', () => {
    const mockOrder = {
      createPaymentInstrument: jest.fn().mockReturnValue({
        paymentTransaction: { custom: {} },
        custom: {},
      }),
    };

    const parsedGiftCardObj = {
      giftCard: {
        amount: { value: 1000, currency: 'USD' },
        pspReference: 'testPspReference',
        name: 'Gift Card Name',
        brand: 'Gift Card Brand',
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a payment instrument with correct properties', () => {
      const divideBy = 100;
      giftCardsHelper.createGiftCardPaymentInstrument(parsedGiftCardObj, divideBy, mockOrder);
      const createdInstrument = mockOrder.createPaymentInstrument.mock.results[0].value;
      expect(createdInstrument.paymentTransaction.paymentProcessor).toStrictEqual({ID: "mockedPaymentProcessor"});
      expect(createdInstrument.paymentTransaction.transactionID).toBe(parsedGiftCardObj.giftCard.pspReference);
      expect(createdInstrument.custom.adyenPaymentMethod).toBe(parsedGiftCardObj.giftCard.name);
      expect(createdInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`]).toBe(parsedGiftCardObj.giftCard.name);
      expect(createdInstrument.custom.Adyen_Payment_Method_Variant).toBe(parsedGiftCardObj.giftCard.brand);
      expect(createdInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`]).toBe(parsedGiftCardObj.giftCard.brand);
      expect(createdInstrument.paymentTransaction.custom.Adyen_log).toBe(JSON.stringify(parsedGiftCardObj));
      expect(createdInstrument.paymentTransaction.custom.Adyen_pspReference).toBe(parsedGiftCardObj.giftCard.pspReference);
      expect(AdyenHelper.setPaymentTransactionType).toHaveBeenCalledWith(
        createdInstrument,
        parsedGiftCardObj.giftCard
      );
    });
  });
});
