jest.mock('../errorHandler', () => ({
  handlePlaceOrderError: jest.fn()
}))

let handlePlaceOrder;
let COHelpers;
let req;
let res;
let adyenHelper;

beforeEach(() => {
  jest.clearAllMocks();

  req = { locale: { id: 'mocked_locale_id' } }
  res = {
    redirect: jest.fn(),
    render: jest.fn(),
  }
  handlePlaceOrder = require("../order");
  COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
})

describe('Order', () => {
  it('should handle place order error', () => {
    const { handlePlaceOrderError } = require('../errorHandler');
    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    COHelpers.placeOrder.mockReturnValue({ error: true })
    handlePlaceOrder()
    expect(handlePlaceOrderError).toBeCalledTimes(1)
  })
  it('should handle place order error', () => {
    const OrderMgr = require('dw/order/OrderMgr');
    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstrument = order.getPaymentInstruments()[0];

    handlePlaceOrder(paymentInstrument, order, {}, { req, res, next: jest.fn() })
    expect(res.render.mock.calls).toMatchSnapshot()
  })
})