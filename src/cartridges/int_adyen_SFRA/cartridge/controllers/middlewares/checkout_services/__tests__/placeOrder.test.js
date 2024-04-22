/* eslint-disable global-require */

let req;
let res;
const placeOrder = require('../placeOrder');
const adyenHelpers = require('*/cartridge/adyen/utils/authorizationHelper');

beforeEach(() => {
  const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
  hooksHelper.mockImplementation(() => ({}));
  jest.clearAllMocks();
  res = { json: jest.fn() };
  req = {
    session: { privacyCache: { get: jest.fn(), set: jest.fn() } },
    currentCustomer: {addressBook: true},
    locale: { id: 'nl_NL' },
  };
});

describe('Checkout Services', () => {
  it('should go to next middleware if payment instrument is not Adyen', () => {
    const {isNotAdyen} = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices');
    isNotAdyen.mockImplementationOnce(jest.fn(() => true));
    const {validateProducts} = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    const next = jest.fn();
    placeOrder(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(validateProducts).toHaveBeenCalledTimes(0);
  });
  it('should process payment if action is valid', () => {
    const {processPayment} = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices');
    placeOrder.call({ emit: jest.fn() }, req, res, jest.fn());
    expect(processPayment).toHaveBeenCalledTimes(1);
  });
  it('should not process payment and return json response at end of file when there is no action', () => {
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    adyenHelpers.handlePayments.mockImplementationOnce(() => ({error: false}));
    placeOrder.call({ emit: jest.fn() }, req, res, jest.fn());
    expect(COHelpers.sendConfirmationEmail).toBeCalledTimes(1);
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should attempt to cache orderNumber after order creation', () => {
    placeOrder.call({ emit: jest.fn() }, req, res, jest.fn());
    expect(req.session.privacyCache.set.mock.calls[0][0]).toBe('currentOrderNumber');
    expect(req.session.privacyCache.set.mock.calls[0][1]).toBe('mocked_orderNo');
    expect(req.session.privacyCache.set.mock.calls[1][0]).toBe('currentOrderToken');
    expect(req.session.privacyCache.set.mock.calls[1][1]).toBe('mocked_orderToken');
  });
});
