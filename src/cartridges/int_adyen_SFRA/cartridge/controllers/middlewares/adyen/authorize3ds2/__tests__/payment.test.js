const handlePaymentsDetailsCall = require("../payment")

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
  it('should handle invalid request', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ invalidRequest: true })
    URLUtils.httpHome = jest.fn();
    const order = { orderNo: 'mocked_orderNo'}
    handlePaymentsDetailsCall({}, order, {}, { res, next: jest.fn() })
    const Logger = require('dw/system/Logger');
    expect(Logger.error).toHaveBeenCalledWith(
        `Invalid request for order ${order.orderNo}`,
      );
  })
  it('should handle invalid payment', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ error: true })
    handlePaymentsDetailsCall({}, {}, {}, { res, next: jest.fn() })
    expect(handlePaymentError).toBeCalledTimes(1)
  })
  it('should handle challengeShopper', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ resultCode: 'ChallengeShopper', action: 'mocked_action', merchantReference: 'mocked_merchantReference', })
    const paymentInstrument = { custom: {}, };
    handlePaymentsDetailsCall({}, {}, paymentInstrument, { res, next: jest.fn() })
    expect(URLUtils.url.mock.calls).toMatchSnapshot()
  })

  it('should place order', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({ resultCode: 'Authorised', error: false, merchantReference: 'mocked_merchantReference', })
    handlePaymentsDetailsCall({}, 'mocked_order', { custom: {} }, { res, next: jest.fn() })
    expect(handlePlaceOrder.mock.calls).toMatchSnapshot()
  })
})