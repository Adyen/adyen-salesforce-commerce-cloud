/* eslint-disable global-require */
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');

let res;
let req;
const next = jest.fn();

const makeExpressPaymentDetailsCall = require('../makeExpressPaymentDetailsCall');

beforeEach(() => {
  jest.clearAllMocks();
  req = {
    form: {data: JSON.stringify({data: {}})}
  };

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
    setStatusCode: jest.fn(),
  };
  AdyenLogs.error_log = jest.fn();
  AdyenLogs.fatal_log = jest.fn();
  URLUtils.url = jest.fn();
});

afterEach(() => {
  jest.resetModules();
});

describe('Express Payment Details controller', () => {
  it('Should return response when payment details call is successful', () => {
    currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    makeExpressPaymentDetailsCall(req, res, next);
    expect(res.json).toHaveBeenCalledWith({"orderNo": "mocked_orderNo", "orderToken": "mocked_orderToken"});
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should return error response when payment details call is not successful', () => {
    adyenCheckout.doPaymentsDetailsCall = jest.fn().mockImplementationOnce(() => {throw new Error('unexpected mock error')});
    makeExpressPaymentDetailsCall(req, res, next);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(URLUtils.url).toHaveBeenCalledWith('Error-ErrorCode', 'err', 'general');
    expect(next).toHaveBeenCalled();
  });
  it('Should return error response when place Order is not successful', () => {
    COHelpers.placeOrder = jest.fn(() => ({error: true}))
    makeExpressPaymentDetailsCall(req, res, next);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(URLUtils.url).toHaveBeenCalledWith('Error-ErrorCode', 'err', 'general');
    expect(next).toHaveBeenCalled();
  });
});
