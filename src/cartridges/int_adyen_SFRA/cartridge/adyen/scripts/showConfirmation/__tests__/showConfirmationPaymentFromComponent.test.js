/* eslint-disable global-require */
let showConfirmationPaymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  showConfirmationPaymentFromComponent =
    adyen.showConfirmationPaymentFromComponent;
  jest.clearAllMocks();
  const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
  adyenConfigs.getKlarnaInlineWidgetEnabled = jest.fn().mockReturnValue(false);
  res = { redirect: jest.fn(), json: jest.fn() };
  req = {
    form: {
      additionalDetailsHidden: JSON.stringify({
        paymentData: 'mocked_paymentData',
        details: 'mocked_details',
        paymentMethod: {
          type: 'mocked_type'
        }
      }),
      result: null
    },
    locale: { id: 'nl_NL' },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Show Confirmation Payment From Component', () => {
  test.each(['Authorised', 'Pending', 'Received'])(
    'should handle successful payment: %p',
    (a) => {
      const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
      const URLUtils = require('dw/web/URLUtils');

      adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
        resultCode: a,
      }));
      showConfirmationPaymentFromComponent(req, res, jest.fn());
      expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
    },
  );
  it('should redirect on unsuccessful payment', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'Not_Authorised',
    }));
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});
