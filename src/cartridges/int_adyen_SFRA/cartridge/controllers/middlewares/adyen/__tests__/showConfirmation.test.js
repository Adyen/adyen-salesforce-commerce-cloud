/* eslint-disable global-require */
let showConfirmation;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
  };

  req = {
    querystring: {
      merchantReference: 'mocked_merchantReference'
    },
    locale: { id: 'nl_NL' },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Show Confirmation', () => {
  it('should have redirectResult', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should have payload', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    req.querystring.payload = 'mocked_payload_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  test.each(['Authorised', 'Pending', 'Received'])(
    'should handle successful payment: %p',
    (a) => {
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const URLUtils = require('dw/web/URLUtils');
      adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference',
      }));
      showConfirmation(req, res, jest.fn());
      expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
    },
  );
  it('should fail if resultCode is Received with Alipay payment', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'Received',
      paymentMethod: ['alipay_hk'],
    }));
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});
