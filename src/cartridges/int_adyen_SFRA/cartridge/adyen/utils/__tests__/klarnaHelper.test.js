/* eslint-disable global-require */
const { checkIsKlarnaPayment } = require('../klarnaHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  error_log: jest.fn(),
}));

describe('checkIsKlarnaPayment', () => {
  // Helper to create a mock payment instrument
  const createMockPaymentInstrument = (adyenPaymentData) => ({
    custom: {
      adyenPaymentData: adyenPaymentData
        ? JSON.stringify(adyenPaymentData)
        : null,
    },
  });

  // Helper to create a mock basket
  const createMockBasket = (paymentInstruments) => ({
    getPaymentInstruments: () => ({
      toArray: () => paymentInstruments,
      empty: !paymentInstruments || paymentInstruments.length === 0,
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if the basket is null or undefined', () => {
    expect(checkIsKlarnaPayment(null)).toBe(false);
    expect(checkIsKlarnaPayment(undefined)).toBe(false);
  });

  it('should return false if the basket has no payment instruments', () => {
    const basket = createMockBasket([]);
    expect(checkIsKlarnaPayment(basket)).toBe(false);
  });

  it('should return false if a payment instrument has no adyenPaymentData', () => {
    const pi = createMockPaymentInstrument(null);
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(false);
  });

  it('should return false for a non-Klarna Adyen payment method', () => {
    const pi = createMockPaymentInstrument({
      paymentMethod: { type: 'ideal' },
    });
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(false);
  });

  it('should return true for a "klarna" payment method type', () => {
    const pi = createMockPaymentInstrument({
      paymentMethod: { type: 'klarna' },
    });
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(true);
  });

  it('should return true for a payment method type that includes "klarna"', () => {
    const pi = createMockPaymentInstrument({
      paymentMethod: { type: 'klarna_paynow' },
    });
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(true);
  });

  it('should return true if one of multiple payment instruments is Klarna', () => {
    const pi1 = createMockPaymentInstrument({
      paymentMethod: { type: 'ideal' },
    });
    const pi2 = createMockPaymentInstrument({
      paymentMethod: { type: 'klarna' },
    });
    const basket = createMockBasket([pi1, pi2]);
    expect(checkIsKlarnaPayment(basket)).toBe(true);
  });

  it('should handle invalid JSON in adyenPaymentData and log an error', () => {
    const pi = { custom: { adyenPaymentData: '{invalid_json' } };
    const basket = createMockBasket([pi]);

    expect(checkIsKlarnaPayment(basket)).toBe(false);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
  });

  it('should return false if adyenPaymentData is missing the paymentMethod object', () => {
    const pi = createMockPaymentInstrument({ someOtherData: 'value' });
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(false);
  });

  it('should return false if paymentMethod object is missing the type property', () => {
    const pi = createMockPaymentInstrument({ paymentMethod: { brand: 'visa' } });
    const basket = createMockBasket([pi]);
    expect(checkIsKlarnaPayment(basket)).toBe(false);
  });
});