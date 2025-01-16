const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const handlePayment = require('../handlePaymentFromComponent');

let res;
let next;
let req;
let order;
beforeEach(() => {
  jest.clearAllMocks();
  req = { locale: { id: 'mocked_locale' }, form: { result: "123" }};
  res = { redirect: jest.fn() };
  order = OrderMgr.getOrder();
  next = jest.fn();
});

describe('Payment', () => {
  it('should successfully handle payment', () => {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
    });
    const stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details',
    };
    handlePayment(stateData, order, { req, res, next });
    expect(res.redirect.mock.calls).toMatchSnapshot();
  });

  it('should handle payment error when not Authorised', () => {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Not_Authorised',
    });
    const stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details',
    };
    handlePayment(stateData, order, { req, res, next });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Checkout-Begin",
          "stage",
          "payment",
          "paymentError",
          "mocked_error.payment.not.valid",
        ],
      ]
    `);
  });

  it('should handle payment error when theres not state data', () => {
    const stateData = {};
    handlePayment(stateData, order, { req, res, next });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Checkout-Begin",
          "stage",
          "payment",
          "paymentError",
          "mocked_error.payment.not.valid",
        ],
      ]
    `);
  });
});
