jest.mock('../transaction');
jest.mock('../../helpers/index', () => ({
  hasAdyenPaymentMethod: jest.fn(),
}));
jest.mock('../payment');
jest.mock('../fraud');

const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const createOrder = require('../order');
const handlePaymentAuthorization = require('../payment');
const handleFraudDetection = require('../fraud');
const handleTransaction = require('../transaction');
const { hasAdyenPaymentMethod } = require('../../helpers/index');

let req;
let res;
let emit;
let next;
beforeEach(() => {
  jest.clearAllMocks();
  req = {
    locale: { id: 'nl_NL' },
    session: { privacyCache: { set: jest.fn() } },
  };
  res = { json: jest.fn() };
  emit = jest.fn();
  next = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Order', () => {
  it('should go to next middleware if paymentMethod is not Adyen', () => {
    hasAdyenPaymentMethod.mockReturnValue(false);
    createOrder({}, { req, res, next }, emit);
    expect(next).toHaveBeenCalledTimes(1);
    expect(handleTransaction).toBeCalledTimes(0);
  });
  it('should return nothing on invalid transaction', () => {
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(false);
    const result = createOrder({}, { req, res, next }, emit);
    expect(result).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(0);
  });
  it('should return json response with error when order is not created', () => {
    COHelpers.createOrder.mockReturnValue(false);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);

    createOrder({}, { req, res, next }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(next).toHaveBeenCalledTimes(0);
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return nothing when payment is not authorized', () => {
    handlePaymentAuthorization.mockReturnValue(false);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);

    const result = createOrder({}, { req, res, next }, emit);
    expect(result).toBeUndefined();
    expect(handleTransaction).toBeCalledTimes(1);
  });
  it('should return nothing when fraud detection is unsuccessful', () => {
    handleFraudDetection.mockReturnValue(false);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);

    const result = createOrder({}, { req, res, next }, emit);
    expect(result).toBeUndefined();
    expect(handlePaymentAuthorization).toBeCalledTimes(1);
  });
  it('should return nothing when there is an error while placing the order', () => {
    COHelpers.placeOrder.mockReturnValue({ error: true });
    handleFraudDetection.mockReturnValue(true);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);

    const result = createOrder({}, { req, res, next }, emit);
    expect(result).toBeUndefined();
    expect(handleFraudDetection).toBeCalledTimes(1);
  });
  it('should confirm order', () => {
    COHelpers.placeOrder.mockReturnValue({ error: false });
    handleFraudDetection.mockReturnValue(true);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue({ orderNo: 1, orderToken: 'token' });
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);

    createOrder({}, { req, res, next }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
