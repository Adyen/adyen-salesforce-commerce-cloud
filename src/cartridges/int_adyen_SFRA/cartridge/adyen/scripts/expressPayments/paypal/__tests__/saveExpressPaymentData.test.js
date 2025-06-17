/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

let res;
let req;
const next = jest.fn();

const saveExpressPaymentData = require('../saveExpressPaymentData');

beforeEach(() => {
  jest.clearAllMocks();
  currentBasket = {
    getPaymentInstruments: jest.fn(() => ([{
      custom: { adyenPaymentMethod: '' }
    }])),
    custom: {
      paypalExpressPaymentData: ''
    }
  };

  req = {
    form: {
      data: JSON.stringify({details: 'test_paymentsDetails'}),
    },
    currentCustomer: {
      raw: ''
    },
    locale: {
      id: 'NL'
    },
    session: {
      privacyCache: {
        get: jest.fn()
      }
    }
  };

  res = {
    json: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    setStatusCode: jest.fn(),
  };
  AdyenLogs.error_log = jest.fn();
  BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
});

afterEach(() => {
  jest.resetModules();
});

describe('SaveExpressPaymentData controller', () => {
  it('Should return success if payment data is saved', () => {
    saveExpressPaymentData(req, res, next);
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith( {
      success: true,
      redirectUrl: '["Adyen-CheckoutReview"]',
      }
    )
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should fail when no express payment data is submitted', () => {
    req.form = '';
    saveExpressPaymentData(req, res, next);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Error-ErrorCode", "err", "general");
    expect(next).toHaveBeenCalled();
  });
  it('Should redirect to Cart if there is no current Basket', () => {
    BasketMgr.getCurrentBasket = jest.fn().mockImplementationOnce(() => (''))
    saveExpressPaymentData(req, res, next);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Cart-Show");
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('Should redirect to Cart if product validation fails', () => {
    validationHelpers.validateProducts = jest.fn(() => ({error: true}))
    saveExpressPaymentData(req, res, next);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Cart-Show");
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
