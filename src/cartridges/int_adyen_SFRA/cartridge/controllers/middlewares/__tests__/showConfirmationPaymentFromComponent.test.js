/* eslint-disable global-require */
let showConfirmationPaymentFromComponent;
let res;
let req;

beforeEach(() => {
  showConfirmationPaymentFromComponent = require('../showConfirmationPaymentFromComponent');
  jest.clearAllMocks();
  res = { redirect: jest.fn() };
  req = {
    form: { additionalDetailsHidden: JSON.stringify({ foo: 'bar' }) },
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
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const URLUtils = require('dw/web/URLUtils');
      adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
        resultCode: a,
      }));
      showConfirmationPaymentFromComponent(req, res, jest.fn());
      expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
    },
  );
  it('should redirect on placeOrder error', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));
    COHelpers.placeOrder.mockImplementation(() => ({ error: true }));
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should redirect on unsuccessful payment', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode: 'Not_Authorised',
    }));
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});
