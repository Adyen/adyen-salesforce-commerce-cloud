"use strict";

/* eslint-disable global-require */
var req;
var savePaymentInformation;
var currentBasket;
var billingData;
var _require = require('*/cartridge/scripts/checkout/checkoutHelpers'),
  savePaymentInstrumentToWallet = _require.savePaymentInstrumentToWallet;
beforeEach(function () {
  savePaymentInformation = require('../savePaymentInformation');
  jest.clearAllMocks();
  req = {
    currentCustomer: {
      raw: {
        authenticated: true,
        registered: true
      },
      profile: {
        customerNo: 'mockedNo'
      },
      wallet: {
        paymentInstruments: []
      }
    }
  };
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  billingData = {
    paymentMethod: {
      value: 'CREDIT_CARD'
    },
    saveCard: true,
    storedPaymentUUID: false
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('savePaymentInformation', function () {
  it('should call savePaymentInstrumentsToWallet when all conditions are met', function () {
    savePaymentInformation(req, currentBasket, billingData);
    expect(savePaymentInstrumentToWallet).toBeCalledTimes(1);
  });
  it('should not call savePaymentInstrumentsToWallet when some conditions are not met ', function () {
    savePaymentInformation(req, currentBasket, billingData);
    req.currentCustomer.raw.registered = false;
    expect(savePaymentInstrumentToWallet).toBeCalledTimes(0);
  });
});