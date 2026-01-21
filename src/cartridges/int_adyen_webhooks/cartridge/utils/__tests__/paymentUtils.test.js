const handleAdyenPaymentInstruments = require('../paymentUtils').handleAdyenPaymentInstruments;

describe('handleAdyenPaymentInstruments', () => {
  let customObj;

  beforeEach(() => {
    customObj = { custom: { Adyen_log: 'test-log' } };
    jest.clearAllMocks();
  });

  it('should return true and set Adyen_log for Adyen method', () => {
    const paymentInstruments = {
      pi1: {
        paymentMethod: 'AdyenPOS',
        getPaymentMethod: () => 'Adyen_POS',
        paymentTransaction: { custom: {} },
      },
    };
    const result = handleAdyenPaymentInstruments(paymentInstruments, customObj);
    expect(result).toBe(true);
    expect(paymentInstruments.pi1.paymentTransaction.custom.Adyen_log).toBe('test-log');
  });

  it('should return false if no Adyen instrument is present', () => {
    const paymentInstruments = {
      pi1: {
        paymentMethod: 'OTHER',
        getPaymentMethod: () => 'OTHER',
        paymentTransaction: { custom: {} },
      },
    };
    const result = handleAdyenPaymentInstruments(paymentInstruments, customObj);
    expect(result).toBe(false);
    expect(paymentInstruments.pi1.paymentTransaction.custom.Adyen_log).toBeUndefined();
  });
});
