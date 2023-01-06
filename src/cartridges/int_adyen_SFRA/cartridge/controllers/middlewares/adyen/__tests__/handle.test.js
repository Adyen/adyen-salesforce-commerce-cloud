/* eslint-disable global-require */

let basket;
let paymentInformation;
let handle;
let req;
let res;

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
    const adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    const constants = require('*/cartridge/adyenConstants/constants');
    const paymentInformation = { isCreditCard: true };
    expect(adyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_CREDIT_CARD);
  });
  it('payment instrument type should be AdyenComponent', () => {
    const adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    const constants = require('*/cartridge/adyenConstants/constants');
    const paymentInformation = { isCreditCard: false };
    expect(adyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_ADYEN_COMPONENT);
  });
})