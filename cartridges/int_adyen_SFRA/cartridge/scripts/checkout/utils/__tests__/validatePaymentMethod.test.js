"use strict";

/* eslint-disable global-require */
var validatePaymentMethod;
var PaymentInstrument;
var PaymentMgr;
var paymentInstrument;
beforeEach(function () {
  jest.clearAllMocks();
  validatePaymentMethod = require('../validatePaymentMethod');
  PaymentInstrument = require('dw/order/PaymentInstrument');
  PaymentMgr = require('dw/order/PaymentMgr');
  paymentInstrument = {
    getPaymentMethod: jest.fn(),
    getCreditCardToken: jest.fn(function () {
      return true;
    })
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Validate Payment Method', function () {
  it('should be invalid if is not a gift certificate nor applicable', function () {
    PaymentMgr.getPaymentMethod.mockReturnValue(false);
    var validatePaymentInstrument = validatePaymentMethod();
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
  it('should be invalid if is not a gift certificate or applicable does not contain pm', function () {
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    var validatePaymentInstrument = validatePaymentMethod({}, {
      contains: jest.fn(function () {
        return false;
      })
    });
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
  it('should be valid if is a gift certificate', function () {
    PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(false);
    var validatePaymentInstrument = validatePaymentMethod();
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be valid if applicable pm contains card', function () {
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    var mock = {
      contains: jest.fn(function () {
        return true;
      })
    };
    var validatePaymentInstrument = validatePaymentMethod(mock, mock);
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be valid if applicable pm contains CC token', function () {
    paymentInstrument.getCreditCardToken.mockReturnValue(true);
    PaymentInstrument.METHOD_CREDIT_CARD.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    var mockCard = {
      contains: jest.fn(function () {
        return false;
      })
    };
    var mockPM = {
      contains: jest.fn(function () {
        return true;
      })
    };
    var validatePaymentInstrument = validatePaymentMethod(mockCard, mockPM);
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeTruthy();
  });
  it('should be invalid if applicable pm does not contain card nor CC token', function () {
    paymentInstrument.getCreditCardToken.mockReturnValue(false);
    PaymentInstrument.METHOD_CREDIT_CARD.equals.mockReturnValue(true);
    PaymentMgr.getPaymentMethod.mockReturnValue(true);
    PaymentMgr.getPaymentCard.mockReturnValue(true);
    var mockCard = {
      contains: jest.fn(function () {
        return false;
      })
    };
    var mockPM = {
      contains: jest.fn(function () {
        return true;
      })
    };
    var validatePaymentInstrument = validatePaymentMethod(mockCard, mockPM);
    var result = validatePaymentInstrument(paymentInstrument);
    expect(result).toBeFalsy();
  });
});