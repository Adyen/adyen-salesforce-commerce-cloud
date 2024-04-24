/* eslint-disable global-require */
let showConfirmation;
let adyenConfigs;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();

  res = {
    redirect: jest.fn(),
    render: jest.fn(),
  };

  req = {
    querystring: {
      merchantReference: "0",
      signature: 'mocked_signature',
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
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });

  it('should have payload', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    req.querystring.payload = 'mocked_payload_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });

  it('should return to checkout when signatures mismatch', () => {
      req.querystring.payload = 'mocked_payload_result';
      req.querystring.signature = 'mismatching_signature';
      const URLUtils = require('dw/web/URLUtils');
      const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
      adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
      showConfirmation(req, res, jest.fn());
      expect(URLUtils.url.mock.calls[0][0]).toEqual('Error-ErrorCode');
  })

  it('should not continue processing when order is not open or failed', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    req.querystring.merchantReference = 4;
    const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    showConfirmation(req, res, jest.fn());
    expect(res.render.mock.calls[0][0]).toEqual('orderConfirmForm');
    expect(adyenCheckout.doPaymentsDetailsCall).not.toBeCalled();
  })

  test.each(['Authorised', 'Pending', 'Received'])(
    'should handle successful payment: %p for SFRA6',
    (a) => {
      const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
      const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
      adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
      adyenConfigs.getAdyenSFRA6Compatibility.mockReturnValue(true);
      adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference',
      }));
      req.querystring.redirectResult = 'mocked_redirect_result';
      showConfirmation(req, res, jest.fn());
      expect(res.render.mock.calls[0][0]).toBe('orderConfirmForm');
    },
  );
  test.each(['Authorised', 'Pending', 'Received'])(
  'should handle successful payment: %p for SFRA5',
      (a) => {
        const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
        const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
        adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
        adyenConfigs.getAdyenSFRA6Compatibility.mockReturnValue(false);
        const URLUtils = require('dw/web/URLUtils');
        adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
          resultCode: a,
          paymentMethod: [],
          merchantReference: 'mocked_merchantReference',
        }));
        req.querystring.redirectResult = 'mocked_redirect_result';
        showConfirmation(req, res, jest.fn());
        expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
      },
  );
});
