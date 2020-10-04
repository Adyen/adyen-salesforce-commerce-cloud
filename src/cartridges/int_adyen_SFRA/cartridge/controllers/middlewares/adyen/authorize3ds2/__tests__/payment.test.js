const handlePaymentsCall = require("../payment")

jest.mock('../errorHandler', () => ({
  handlePaymentError: jest.fn()
}))

jest.mock('../order')

let adyenCheckout;
let handlePaymentError;
let URLUtils;
let handlePlaceOrder;
let res;
let req;

beforeEach(() => {
  jest.clearAllMocks();
  res = { redirect: jest.fn() }
  adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  handlePaymentError = require('../errorHandler').handlePaymentError;
  URLUtils = require('dw/web/URLUtils');
  handlePlaceOrder = require("../order");
})
describe('Payment', () => {
  it('should handle invalid payment', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ error: true })
    handlePaymentsCall()
    expect(handlePaymentError).toBeCalledTimes(1)
  })
  it('should handle challengeShopper', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ resultCode: 'ChallengeShopper', action: 'mocked_action' })
    handlePaymentsCall({}, {}, {}, { res, next: jest.fn() })
    expect(URLUtils.url.mock.calls).toMatchSnapshot()
  })

  it('should place order', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ resultCode: 'Authorised', error: false })
    handlePaymentsCall({}, 'mocked_order', { custom: {} }, { res, next: jest.fn() })
    expect(handlePlaceOrder.mock.calls).toMatchSnapshot()
  })
})