const BasketMgr = require('dw/order/BasketMgr');
const paymentResponseHandler = require('../paymentResponse');

let paymentInstrument;
const orderNumber = 'mocked_order_number';
beforeEach(() => {
  [paymentInstrument] = BasketMgr.toArray();
});

describe('Payment Response Handler', () => {
  it('should get 3ds2 response', () => {
    const result = {
      threeDS2: true,
      resultCode: 'mocked_result_code',
      fullResponse: {action: 'mocked_action'},
    };
    const response = paymentResponseHandler(
      paymentInstrument,
      result,
      orderNumber,
    );
    expect(response).toMatchSnapshot();
  });
  it('should get redirect response with payment data signature', () => {
    const result = {
      threeDS2: false,
      resultCode: 'mocked_result_code',
      paymentData: 'mocked_payment_data',
      redirectObject: {
        url: 'mocked_redirect_url',
      },
    };
    const response = paymentResponseHandler(
      paymentInstrument,
      result,
      orderNumber,
    );
    expect(response).toMatchSnapshot();
  });
  it('should get redirect response with md signature', () => {
    const result = {
      threeDS2: false,
      resultCode: 'mocked_result_code',
      paymentData: 'mocked_payment_data',
      redirectObject: {
        data: {
          MD: 'mocked_redirect_MD',
        },
        url: 'mocked_redirect_url',
      },
    };
    const response = paymentResponseHandler(
      paymentInstrument,
      result,
      orderNumber,
    );
    expect(response).toMatchSnapshot();
  });
});
