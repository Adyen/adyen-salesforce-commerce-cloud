/* eslint-disable global-require */
const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

let res;
let req;
const next = jest.fn();

const saveShopperData = require('../saveShopperData');

beforeEach(() => {
  jest.clearAllMocks();
  req = {
    form: {shopperDetails: JSON.stringify({})}
  };

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
    setStatusCode: jest.fn(),
  };
  AdyenLogs.error_log = jest.fn();
  URLUtils.url = jest.fn();
});

afterEach(() => {
  jest.resetModules();
});

describe('Save Shopper controller', () => {
  it('Should return response when Save Shopper call is successful', () => {
    saveShopperData(req, res, next);
    expect(res.json).toHaveBeenCalledWith({"success": true});
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should return response when Save Shopper call is not successful', () => {
    res.json = jest.fn(() => {throw new Error('unexpected mock error')});
    saveShopperData(req, res, next);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(URLUtils.url).toHaveBeenCalledWith('Error-ErrorCode', 'err', 'general');
    expect(next).toHaveBeenCalled();
  });
});
