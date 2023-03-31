/* eslint-disable global-require */
let validatePaymentMethod;
let PaymentInstrument;
let PaymentMgr;
let paymentInstrument;

beforeEach(() => {
  jest.clearAllMocks();

  validatePaymentMethod = require('../validatePaymentMethod');
  PaymentInstrument = require('dw/order/PaymentInstrument');
  PaymentMgr = require('dw/order/PaymentMgr');
  paymentInstrument = {
    getPaymentMethod: jest.fn(),
    getCreditCardToken: jest.fn(() => true),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Validate Payment Method', () => {
  it('should be invalid if is not a gift certificate nor applicable', () => {
    PaymentMgr.getPaymentMethod.mockReturnValue(false);
    const validatePaymentInstrument = validatePaymentMethod();
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
  it('should be invalid if is not a gift certificate or applicable does not contain pm', () => {
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    const validatePaymentInstrument = validatePaymentMethod(
      {},
      { contains: jest.fn(() => false) },
    );
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
  it('should be valid if is a gift certificate', () => {
    PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(false);
    const validatePaymentInstrument = validatePaymentMethod();
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be valid if applicable pm contains card', () => {
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    const mock = { contains: jest.fn(() => true) };
    const validatePaymentInstrument = validatePaymentMethod(mock, mock);
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be valid if applicable pm contains CC token', () => {
    paymentInstrument.getCreditCardToken.mockReturnValue(true);
    PaymentInstrument.METHOD_CREDIT_CARD.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    const mockCard = { contains: jest.fn(() => false) };
    const mockPM = { contains: jest.fn(() => true) };
    const validatePaymentInstrument = validatePaymentMethod(mockCard, mockPM);
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be invalid if applicable pm does not contain card nor CC token', () => {
    paymentInstrument.getCreditCardToken.mockReturnValue(false);
    PaymentInstrument.METHOD_CREDIT_CARD.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    const mockCard = { contains: jest.fn(() => false) };
    const mockPM = { contains: jest.fn(() => true) };
    const validatePaymentInstrument = validatePaymentMethod(mockCard, mockPM);
    const result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
});
