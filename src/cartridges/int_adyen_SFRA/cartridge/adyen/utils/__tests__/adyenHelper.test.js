/* eslint-disable global-require */
const savePaymentDetails = require('../adyenHelper').savePaymentDetails;
describe('savePaymentDetails', () => {
  let paymentInstrument;
  let order;
  let result;

  beforeEach(() => {
	  paymentInstrument = {
      paymentTransaction: {
        custom: {}
      },
      getCreditCardToken: jest.fn(),
      setCreditCardToken: jest.fn()
    };
    order = {
      custom: {}
    };
    result = {};
  });

  it('should set the transactionID and Adyen_pspReference', () => {
    result.pspReference = 'testReference';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.transactionID).toBe('testReference');
    expect(paymentInstrument.paymentTransaction.custom.Adyen_pspReference).toBe('testReference');
  });

  it('should set Adyen_paymentMethod from additionalData', () => {
    result.additionalData = { paymentMethod: 'visa' };
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod).toBe('visa');
    expect(order.custom.Adyen_paymentMethod).toBe('visa');
  });

  it('should set Adyen_paymentMethod from paymentMethod', () => {
    result.paymentMethod = { type: 'mc' };
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod).toBe(JSON.stringify('mc'));
    expect(order.custom.Adyen_paymentMethod).toBe(JSON.stringify('mc'));
  });

  it('should set the credit card token if not already exists', () => {
    result.additionalData = { 'recurring.recurringDetailReference': 'token123' };
    paymentInstrument.getCreditCardToken.mockReturnValue(null);
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.setCreditCardToken).toHaveBeenCalledWith('token123');
  });

  it('should not set the credit card token if already exists', () => {
    result.additionalData = { 'recurring.recurringDetailReference': 'token123' };
    paymentInstrument.getCreditCardToken.mockReturnValue('existingToken');
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.setCreditCardToken).not.toHaveBeenCalled();
  });

  it('should set the authCode and Adyen_value', () => {
    result.resultCode = 'Authorised';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.authCode).toBe('Authorised');
    expect(order.custom.Adyen_value).toBe('0');
  });

  it('should set Adyen_donationToken if present', () => {
    result.donationToken = 'donation-token-123';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_donationToken).toBe('donation-token-123');
  });
});
