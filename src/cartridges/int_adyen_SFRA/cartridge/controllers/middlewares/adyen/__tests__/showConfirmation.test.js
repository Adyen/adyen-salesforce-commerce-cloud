/* eslint-disable global-require */
let showConfirmation;
let adyenHelper;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
    render: jest.fn(),
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
  jest.clearAllMocks();
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
    'should handle successful payment: %p for SFRA6',
    (a) => {
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
      adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference',
      }));
      showConfirmation(req, res, jest.fn());
      expect(res.render.mock.calls[0][0]).toBe('orderConfirmForm');
    },
  );
  test.each(['Authorised', 'Pending', 'Received'])(
  'should handle successful payment: %p for SFRA5',
      (a) => {
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(false);
        const URLUtils = require('dw/web/URLUtils');
        adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
          resultCode: a,
          paymentMethod: [],
          merchantReference: 'mocked_merchantReference',
        }));
        showConfirmation(req, res, jest.fn());
        expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
      },
  );
});
