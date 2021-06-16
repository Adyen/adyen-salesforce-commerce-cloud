const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const handlePayment = require('../payment');

let res;
let next;
let req;
let order;
beforeEach(() => {
  jest.clearAllMocks();
  req = { locale: { id: 'mocked_locale' } };
  res = { redirect: jest.fn() };
  order = OrderMgr.getOrder();
  next = jest.fn();
});

const paymentErrorSnap = `
  Array [
    Array [
      "Checkout-Begin",
      "stage",
      "placeOrder",
      "paymentError",
      "mocked_error.payment.not.valid",
    ],
  ]
`;

describe('Payment', () => {
  it('should successfully handle payment', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
    });
    const stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details',
    };
    handlePayment(stateData, order, null, { req, res, next });
    expect(res.redirect.mock.calls).toMatchSnapshot();
  });

  it('should handle payment error when not Authorised', () => {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'Not_Authorised',
    });
    const stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details',
    };
    handlePayment(stateData, order, null, { req, res, next });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot(paymentErrorSnap);
  });

  it('should handle payment error when theres not state data', () => {
    const stateData = {};
    handlePayment(stateData, order, null, { req, res, next });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot(paymentErrorSnap);
  });
});
