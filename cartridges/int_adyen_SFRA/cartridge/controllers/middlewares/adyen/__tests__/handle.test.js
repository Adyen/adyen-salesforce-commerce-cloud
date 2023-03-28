"use strict";

/* eslint-disable global-require */

var basket;
var paymentInformation;
var handle;
var req;
var res;
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
beforeEach(function () {
  jest.clearAllMocks();
  req = {};
  res = {
    render: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Handle', function () {
  it('payment instrument type should be CREDIT_CARD', function () {
    var constants = require('*/cartridge/adyenConstants/constants');
    var paymentInformation = {
      isCreditCard: true
    };
    expect(AdyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_CREDIT_CARD);
  });
  it('payment instrument type should be AdyenComponent', function () {
    var constants = require('*/cartridge/adyenConstants/constants');
    var paymentInformation = {
      isCreditCard: false
    };
    expect(AdyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard)).toBe(constants.METHOD_ADYEN_COMPONENT);
  });
});