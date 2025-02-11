/* eslint-disable global-require */
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');

let res;
let req;
const next = jest.fn();

const makeExpressPaymentsCall = require('../makeExpressPaymentsCall');

beforeEach(() => {
  jest.clearAllMocks();
  req = {
  form: {data: JSON.stringify({})}
  };

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
    setStatusCode: jest.fn(),
  };
  AdyenLogs.error_log = jest.fn();
  AdyenLogs.fatal_log = jest.fn();
});

afterEach(() => {
  jest.resetModules();
});

describe('Express Payments controller', () => {
  it('Should return response when payments call is successful', () => {
    currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    makeExpressPaymentsCall(req, res, next);
    expect(res.json).toHaveBeenCalledWith({"pspReference": "mocked_pspReference"});
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should return error response when payments call is not successful', () => {
    adyenCheckout.doPaymentsCall = jest.fn(() => {throw new Error('unexpected mock error')});
    makeExpressPaymentsCall(req, res, next);
    expect(AdyenLogs.fatal_log).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({"errorMessage": "mocked_error.express.paypal.payments"})
    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(next).toHaveBeenCalled();
  });
});
