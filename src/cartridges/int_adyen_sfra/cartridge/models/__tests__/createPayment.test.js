const { createSelectedPaymentInstruments } = require('../createPayment');

const withCustom = {
  selectedAdyenPM: 'mocked_custom_pm',
  selectedIssuerName: 'mocked_custom_issuer_name',
  adyenAdditionalPaymentData: { data: 'mocked_data' },
  adyenAction: 'mocked_adyen_action',
};

const withCC = {
  lastFour: 'mocked_last_digits',
  owner: 'mocked_card_holder',
  expirationYear: 'mocked_expiration_year',
  type: 'mocked_cc_type',
  maskedCreditCardNumber: 'mocked_masked_cc_number',
  expirationMonth: 'mocked_expiration_month',
};

const expected = {
  paymentMethod: 'GIFT_CERTIFICATE',
  amount: 1,
  giftCertificateCode: 'mocked_gift_cert_code',
  maskedGiftCertificateCode: 'mocked_masked_gift_cert_code',
  ...withCC,
};
const expectedWithCustom = {
  ...withCustom,
  ...expected,
};

const expectedWithoutCC = {
  ...expectedWithCustom,
  lastFour: null,
  owner: null,
  expirationYear: null,
  type: null,
  maskedCreditCardNumber: null,
  expirationMonth: null,
};
const customObj = {
  adyenPaymentMethod: 'mocked_custom_pm',
  adyenIssuerName: 'mocked_custom_issuer_name',
  adyenAdditionalPaymentData: JSON.stringify({ data: 'mocked_data' }),
  adyenAction: 'mocked_adyen_action',
};
const creditCardObj = {
  creditCardNumberLastDigits: 'mocked_last_digits',
  creditCardHolder: 'mocked_card_holder',
  creditCardExpirationYear: 'mocked_expiration_year',
  creditCardExpirationMonth: 'mocked_expiration_month',
  creditCardType: 'mocked_cc_type',
  maskedCreditCardNumber: 'mocked_masked_cc_number',
};
const getPaymentInstrument = (
  custom = customObj,
  ccObj = creditCardObj,
  paymentMethod = 'GIFT_CERTIFICATE',
) => ({
  paymentMethod,
  paymentTransaction: { amount: { value: 1 } },
  custom,
  ...ccObj,
  giftCertificateCode: 'mocked_gift_cert_code',
  maskedGiftCertificateCode: 'mocked_masked_gift_cert_code',
});
describe('Create Payment', () => {
  it('should get selected payment instrument', () => {
    const result = createSelectedPaymentInstruments(getPaymentInstrument());
    expect(result).toEqual(expectedWithCustom);
  });
  it('should not return optional fields', () => {
    const result = createSelectedPaymentInstruments(getPaymentInstrument({}));
    expect(result).toEqual(expected);
  });
  it("should return null for cc's fields", () => {
    const result = createSelectedPaymentInstruments(
      getPaymentInstrument(customObj, {}),
    );
    expect(result).toEqual(expectedWithoutCC);
  });
  it('should not return gift certificate', () => {
    const mockedName = 'MOCKED_PM_NAME';
    const result = createSelectedPaymentInstruments(
      getPaymentInstrument(customObj, creditCardObj, mockedName),
    );
    expect(result.giftCertificateCode).toBeUndefined();
    expect(result.maskedGiftCertificateCode).toBeUndefined();
    expect(result.paymentMethod).toBe(mockedName);
  });
});
