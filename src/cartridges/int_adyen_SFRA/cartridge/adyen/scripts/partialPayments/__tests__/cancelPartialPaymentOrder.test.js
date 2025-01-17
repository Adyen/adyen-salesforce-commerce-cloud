/* eslint-disable global-require */
let cancelPartialPaymentOrder;
let res;
let req = {
  form: {
    data: {
      paymentMethod: 'givex'
    }
  }
}

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenCheckout',
  () => ({
    doCancelPartialPaymentOrderCall: jest.fn(() => ({ resultCode: 'Received' })),
  }),
  { virtual: true },
);

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  cancelPartialPaymentOrder = adyen.cancelPartialPaymentOrder;
  jest.clearAllMocks();
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('cancelPartialPaymentOrder', () => {
  it('should remove a gift card', async () => {
    cancelPartialPaymentOrder(req, res, jest.fn());
    expect(session.privacy.giftCardResponse).toBeFalsy();
    expect(session.privacy.partialPaymentData).toBeFalsy();
  });
});
