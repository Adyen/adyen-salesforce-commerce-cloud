jest.mock('../errorHandler', () => ({
  handlePlaceOrderError: jest.fn()
}))

let handlePlaceOrder;
let COHelpers;
let req;
let res;

beforeEach(() => {
  jest.clearAllMocks();

  req = { locale: { id: 'mocked_locale_id' } }
  res = { redirect: jest.fn() }
  handlePlaceOrder = require("../order")
  COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
})

describe('Order', () => {
  it('should handle place order error', () => {
    const { handlePlaceOrderError } = require('../errorHandler')
    COHelpers.placeOrder.mockReturnValue({ error: true })
    handlePlaceOrder()
    expect(handlePlaceOrderError).toBeCalledTimes(1)
  })
  it('should handle place order error', () => {
    COHelpers.placeOrder.mockReturnValue({ error: false })
    const OrderMgr = require('dw/order/OrderMgr');
    const URLUtils = require('dw/web/URLUtils');
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstrument = order.getPaymentInstruments()[0];

    handlePlaceOrder(paymentInstrument, order, {}, { req, res, next: jest.fn() })
    expect(URLUtils.url.mock.calls).toMatchSnapshot()
  })
})