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

  it('should fail when doPaymentsDetailsCall results in an error', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

    adyenCheckout.doPaymentsDetailsCall.mockImplementationOnce(() => {throw new Error('mock_error')});
    paymentsDetails(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(0);
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });

  it('should fail when createAdyenCheckoutResponse results in an error', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

    adyenCheckout.doPaymentsDetailsCall.mockImplementationOnce(() => { return {}; });
    AdyenHelper.createAdyenCheckoutResponse.mockImplementationOnce(() => {throw new Error('mock_error')});
    paymentsDetails(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });


  it('should call paymentDetails request and response handler', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    const URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode:'mocked_resultCode',
      pspReference: 'mocked_pspReference',
    }));
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Adyen-ShowConfirmation');
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(1);

    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: true,
      isSuccessful: false,
      redirectUrl: "[\"Adyen-ShowConfirmation\",\"merchantReference\",null,\"signature\",\"mocked_signature\",\"orderToken\",null]"
    });
  });
});
