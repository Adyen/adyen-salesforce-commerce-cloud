/* eslint-disable global-require */
let paymentsDetails;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');

  paymentsDetails = adyen.paymentsDetails;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
  };

  req = {
    body: JSON.stringify({}),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Confirm paymentsDetails', () => {

  it('should fail with invalid stringified JSON body in request', () => {
    const URLUtils = require('dw/web/URLUtils');

    req.body = 'invalid_json_mock';
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });

  it('should handle payment confirmation status Unknown', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode:'Unknown',
      pspReference: 'mocked_pspReference',
    }));
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url).not.toHaveBeenCalled();
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls.length).toEqual(1);
    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: true,
      isSuccessful: false,
    });
    expect(URLUtils.url).not.toHaveBeenCalled();
  });

  it('should handle payment confirmation status Authorised', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');


    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode:'Authorised',
      pspReference: 'mocked_pspReference',
    }));
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url).not.toHaveBeenCalled();
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls.length).toEqual(1);
    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: true,
      isSuccessful: true,
    });
    expect(URLUtils.url).not.toHaveBeenCalled();
  });

  it('should handle payment confirmation status Cancelled', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode:'Cancelled',
      pspReference: 'mocked_pspReference',
    }));
    paymentsDetails(req, res, jest.fn());
    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: true,
      isSuccessful: false,
    });
    expect(URLUtils.url).not.toHaveBeenCalled();
  });

  it('should handle payment confirmation status Received', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');


    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode:'Received',
      pspReference: 'mocked_pspReference',
    }));
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url).not.toHaveBeenCalled();
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls.length).toEqual(1);
    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: false,
    });
    expect(URLUtils.url).not.toHaveBeenCalled();
  });

  test.each(['Error', 'Refused'])(
    'should handle payment confirmation status: %p',
    (resultCode) => {
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const URLUtils = require('dw/web/URLUtils');

      adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
        resultCode,
        refusalReason: 'mocked_reason'
      }));
      paymentsDetails(req, res, jest.fn());
      expect(URLUtils.url).not.toHaveBeenCalled();

      expect(res.json.mock.calls[0][0]).toEqual({
        isFinal: true,
        isSuccessful: false,
        refusalReason: 'mocked_reason'
      });
    },
  );

  test.each([
    'RedirectShopper',
    'IdentifyShopper',
    'ChallengeShopper',
    'PresentToShopper',
    'Pending',
  ])(
      'should handle payment confirmation status: %p',
      (resultCode) => {
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        const URLUtils = require('dw/web/URLUtils');

        adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
          resultCode,
          action: {type: 'redirect'},
        }));
        paymentsDetails(req, res, jest.fn());
        expect(URLUtils.url).not.toHaveBeenCalled();

        expect(res.json.mock.calls[0][0]).toEqual({
          isFinal: false,
          action: {type: 'redirect'}
        });
      },
  );
});
