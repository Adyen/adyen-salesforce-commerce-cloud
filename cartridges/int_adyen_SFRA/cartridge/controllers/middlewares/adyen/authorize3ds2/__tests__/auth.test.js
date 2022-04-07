"use strict";

jest.mock('../payment');
jest.mock('../errorHandler', function () {
  return {
    toggle3DS2Error: jest.fn(),
    handlePaymentError: jest.fn()
  };
});

var createAuthorization = require("../auth");

var req;
var session;
var res;
var adyenCheckout;
var URLUtils;
var handlePaymentsCall;
var toggle3DS2Error;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    form: {
      resultCode: 'Authorized',
      stateData: '{ "details":"mocked details"}'
    },
    locale: {
      id: 'mocked_locale'
    }
  };
  res = {
    redirect: jest.fn()
  };
  handlePaymentsCall = require('../payment');
  toggle3DS2Error = require('../errorHandler').toggle3DS2Error;
});
describe('Auth', function () {
  it('should handle 3ds2 auth when challenge shopper', function () {
    req.form.resultCode = 'ChallengeShopper';
    req.form.challengeResult = true;
    createAuthorization({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handlePaymentsCall.mock.calls).toMatchSnapshot();
  });
  it('should handle 3ds2 auth when has fingerprint', function () {
    req.form.resultCode = 'IdentifyShopper';
    req.form.fingerprintResult = true;
    createAuthorization({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handlePaymentsCall.mock.calls).toMatchSnapshot();
  });
  it('should handle 3ds2 error', function () {
    req.form.resultCode = 'NOT_AUTHORIZED';
    createAuthorization({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(toggle3DS2Error.mock.calls).toMatchSnapshot();
  });
});