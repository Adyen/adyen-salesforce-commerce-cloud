/* eslint-disable global-require */
let showConfirmationPaymentFromComponent;
let res;
let req;

beforeEach(() => {
  showConfirmationPaymentFromComponent = require('../showConfirmationPaymentFromComponent')
    .default;
  jest.clearAllMocks();
  res = { redirect: jest.fn() };
  req = { form: { additionalDetailsHidden: JSON.stringify({ foo: 'bar' }) } };
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
        paymentMethod: [],
      }));
      showConfirmationPaymentFromComponent(req, res, jest.fn());
      expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
    },
  );
});
