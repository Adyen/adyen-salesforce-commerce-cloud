/* eslint-disable global-require */
let confirmRedirectResult;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  confirmRedirectResult = adyen.confirmRedirectResult;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
  };

  req = {
    querystring: {},
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Confirm redirectResult', () => {
  it('should have redirectResult', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    req.querystring.redirectResult = 'mocked_redirect_result';
    confirmRedirectResult(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });

  it('should fail with missing redirectResult', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    confirmRedirectResult(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall).not.toHaveBeenCalled();
    expect(URLUtils.url.mock.calls[0][0]).toBe('PaymentInstruments-AddPayment');
    expect(URLUtils.url.mock.calls[0][1]).toBe('mocked_error.payment.not.valid');
  });

  test.each(['Authorised', 'Cancelled', 'Error', 'Refused'])(
    'should handle payment confirmation statuses: %p',
    (resultCode) => {
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const URLUtils = require('dw/web/URLUtils');

      adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
          resultCode: resultCode,
          pspReference: 'mocked_pspReference',
      }));
      req.querystring.redirectResult = 'mocked_redirect_result';
      confirmRedirectResult(req, res, jest.fn());
      expect(res.json.mock.calls[0][0]).toEqual({
          resultCode: resultCode,
          pspReference: 'mocked_pspReference',
      })
      expect(URLUtils.url).not.toHaveBeenCalled();
    },
  );
});
