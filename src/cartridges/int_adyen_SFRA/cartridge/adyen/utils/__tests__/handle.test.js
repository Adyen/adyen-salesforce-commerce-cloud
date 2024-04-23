/* eslint-disable global-require */

let basket;
let paymentInformation;
let handle;
let req;
let res;
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

beforeEach(() => {
  jest.clearAllMocks();
  req = {};
  res = { render: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Handle', () => {
  it('payment instrument type should be CREDIT_CARD', () => {
    const constants = require('*/cartridge/adyen/config/constants');
    const paymentInformation = { isCreditCard: true };
    expect(AdyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_CREDIT_CARD);
  });
  it('payment instrument type should be AdyenComponent', () => {
    const constants = require('*/cartridge/adyen/config/constants');
    const paymentInformation = { isCreditCard: false };
    expect(AdyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_ADYEN_COMPONENT);
  });
})