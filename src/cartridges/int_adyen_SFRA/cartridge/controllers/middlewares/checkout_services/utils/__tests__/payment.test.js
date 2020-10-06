const handlePaymentAuthorization = require('../payment');

const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

let res;
let emit;
beforeEach(() => {
  jest.clearAllMocks();
  res = { json: jest.fn() };
  emit = jest.fn();
});

describe('Payment', () => {
  it('should return json with error details when payment is unsuccessful', () => {
    adyenHelpers.handlePayments.mockReturnValue({ error: true });
    const paymentCompleted = handlePaymentAuthorization({}, { res }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return 3ds2 json response', () => {
    adyenHelpers.handlePayments.mockReturnValue({
      threeDS2: true,
      resultCode: 'IdentifyShopper',
      action: 'mocked_action',
    });
    const paymentCompleted = handlePaymentAuthorization({}, { res }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return 3d json response', () => {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: {
        url: 'mocked_url',
        data: { PaReq: 'mocked_PaReq', MD: 'mocked_MD' },
      },
      signature: 'mocked_signature',
      authorized3d: true,
    });
    const paymentCompleted = handlePaymentAuthorization({}, { res }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should redirect', () => {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: { url: 'mocked_url' },
      authorized3d: false,
      signature: 'mocked_signature',
    });
    const paymentCompleted = handlePaymentAuthorization({}, { res }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should not redirect', () => {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: false,
      threeDS2: false,
    });
    const paymentCompleted = handlePaymentAuthorization({}, { res }, emit);
    expect(paymentCompleted).toBeTruthy();
  });
});
