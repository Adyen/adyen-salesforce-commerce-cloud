/* eslint-disable global-require */
let redirect3ds1Response;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');

  redirect3ds1Response = adyen.redirect3ds1Response;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
  };

  req = {
    httpParameterMap: {
      get: jest.fn(() => {
        return {
          stringValue: 'mockedRedirectresult',
        };
      }),
    }
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Redirect 3DS1 Response', () => {

  it('should redirect to PaymentInstruments-List on resultCode Authorised', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');

    req.querystring = {
      redirectResult: 'mockedRedirectresult',
    };

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode:'Authorised',
      pspReference: 'mocked_pspReference',
    }));

    redirect3ds1Response(req, res, jest.fn());

    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0][0]).toBe('PaymentInstruments-List');
  });

  it('should redirect to PaymentInstruments-AddPayment on other resultCodes', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');

    req.querystring = {
      redirectResult: 'mockedRedirectresult',
    };

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode:'Cancelled',
      pspReference: 'mocked_pspReference',
    }));

    redirect3ds1Response(req, res, jest.fn());

    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0]).toEqual(['PaymentInstruments-AddPayment', 'isAuthorised', 'false']);
  });

  it('should handle missing querystring contents.', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');

    req.querystring = null;

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode:'Cancelled',
      pspReference: 'mocked_pspReference',
    }));

    redirect3ds1Response(req, res, jest.fn());

    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
  });

});
