/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

let res;
let req;
const next = jest.fn();

const handleCheckoutReview = require('../handleCheckoutReview');

beforeEach(() => {
  jest.clearAllMocks();
  currentBasket = {
    getPaymentInstruments: jest.fn(() => ([{
      custom: { adyenPaymentMethod: '' }
    }])),
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
    redirect: jest.fn(),
    render: jest.fn(),
    setStatusCode: jest.fn(),
  };
  AdyenLogs.error_log = jest.fn();
  URLUtils.url =jest.fn();
  BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
});

afterEach(() => {
  jest.resetModules();
});

describe('Checkout Review controller', () => {
  it('Should return Checkout Review page', () => {
    handleCheckoutReview(req, res, next);
    expect(res.render.mock.calls[0][0]).toBe('cart/checkoutReview');
    expect(res.render.mock.calls[0][1]).toMatchObject( {
      data: '{"details":"test_paymentsDetails"}',
      showConfirmationUrl: expect.anything(),
      order: expect.anything(),
      customer: expect.anything(),
  }
  )
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('Should fail returning Checkout Review page when no state data is submitted', () => {
    req.form = '';
    handleCheckoutReview(req, res, next);
    expect(AdyenLogs.error_log).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Error-ErrorCode", "err", "general");
    expect(next).toHaveBeenCalled();
  });
  it('Should redirect to Cart if there is no current Basket', () => {
    BasketMgr.getCurrentBasket = jest.fn().mockImplementationOnce(() => (''))
    handleCheckoutReview(req, res, next);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Cart-Show");
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('Should redirect to Cart if product validation fails', () => {
    validationHelpers.validateProducts = jest.fn(() => ({error: true}))
    handleCheckoutReview(req, res, next);
    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(URLUtils.url).toHaveBeenCalledWith("Cart-Show");
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
