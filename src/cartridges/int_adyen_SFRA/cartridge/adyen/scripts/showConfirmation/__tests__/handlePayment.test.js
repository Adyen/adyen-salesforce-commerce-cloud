const OrderMgr = require('dw/order/OrderMgr');
const { handlePaymentInstruments } = require('../handlePayment');

let req;
beforeEach(() => {
  req = { querystring: { redirectResult: 'mocked_redirect_result' } };
});

describe('Payment', () => {
  it('should handle payment instruments with redirect result', () => {
    const paymentInstruments = OrderMgr.getPaymentInstruments();

    const result = handlePaymentInstruments(paymentInstruments, { req });
    expect(result).toMatchSnapshot();
  });
  it('should handle payment instruments with payload', () => {
    const paymentInstruments = OrderMgr.getPaymentInstruments();
    req.querystring = { payload: 'mocked_payload' };

    const result = handlePaymentInstruments(paymentInstruments, { req });
    expect(result).toMatchSnapshot();
  });
});
