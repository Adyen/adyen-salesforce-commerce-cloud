"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var _require = require('../createPayment'),
  createSelectedPaymentInstruments = _require.createSelectedPaymentInstruments;
var withCustom = {
  selectedAdyenPM: 'mocked_custom_pm',
  selectedIssuerName: 'mocked_custom_issuer_name',
  adyenAdditionalPaymentData: {
    data: 'mocked_data'
  },
  adyenAction: 'mocked_adyen_action'
};
var withCC = {
  lastFour: 'mocked_last_digits',
  owner: 'mocked_card_holder',
  expirationYear: 'mocked_expiration_year',
  type: 'mocked_cc_type',
  maskedCreditCardNumber: 'mocked_masked_cc_number',
  expirationMonth: 'mocked_expiration_month'
};
var expected = _objectSpread({
  paymentMethod: 'GIFT_CERTIFICATE',
  amount: 1,
  giftCertificateCode: 'mocked_gift_cert_code',
  maskedGiftCertificateCode: 'mocked_masked_gift_cert_code'
}, withCC);
var expectedWithCustom = _objectSpread(_objectSpread({}, withCustom), expected);
var expectedWithoutCC = _objectSpread(_objectSpread({}, expectedWithCustom), {}, {
  lastFour: null,
  owner: null,
  expirationYear: null,
  type: null,
  maskedCreditCardNumber: null,
  expirationMonth: null
});
var customObj = {
  adyenPaymentMethod: 'mocked_custom_pm',
  adyenIssuerName: 'mocked_custom_issuer_name',
  adyenAdditionalPaymentData: JSON.stringify({
    data: 'mocked_data'
  }),
  adyenAction: 'mocked_adyen_action'
};
var creditCardObj = {
  creditCardNumberLastDigits: 'mocked_last_digits',
  creditCardHolder: 'mocked_card_holder',
  creditCardExpirationYear: 'mocked_expiration_year',
  creditCardExpirationMonth: 'mocked_expiration_month',
  creditCardType: 'mocked_cc_type',
  maskedCreditCardNumber: 'mocked_masked_cc_number'
};
var getPaymentInstrument = function getPaymentInstrument() {
  var custom = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : customObj;
  var ccObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : creditCardObj;
  var paymentMethod = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GIFT_CERTIFICATE';
  return _objectSpread(_objectSpread({
    paymentMethod: paymentMethod,
    paymentTransaction: {
      amount: {
        value: 1
      }
    },
    custom: custom
  }, ccObj), {}, {
    giftCertificateCode: 'mocked_gift_cert_code',
    maskedGiftCertificateCode: 'mocked_masked_gift_cert_code'
  });
};
describe('Create Payment', function () {
  it('should get selected payment instrument', function () {
    var result = createSelectedPaymentInstruments(getPaymentInstrument());
    expect(result).toEqual(expectedWithCustom);
  });
  it('should not return optional fields', function () {
    var result = createSelectedPaymentInstruments(getPaymentInstrument({}));
    expect(result).toEqual(expected);
  });
  it("should return null for cc's fields", function () {
    var result = createSelectedPaymentInstruments(getPaymentInstrument(customObj, {}));
    expect(result).toEqual(expectedWithoutCC);
  });
  it('should not return gift certificate', function () {
    var mockedName = 'MOCKED_PM_NAME';
    var result = createSelectedPaymentInstruments(getPaymentInstrument(customObj, creditCardObj, mockedName));
    expect(result.giftCertificateCode).toBeUndefined();
    expect(result.maskedGiftCertificateCode).toBeUndefined();
    expect(result.paymentMethod).toBe(mockedName);
  });
});