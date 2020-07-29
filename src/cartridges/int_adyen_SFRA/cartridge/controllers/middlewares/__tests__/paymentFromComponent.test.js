/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  paymentFromComponent = require('../paymentFromComponent');
  jest.clearAllMocks();
  req = { form: { data: { paymentMethod: { type: 'mocked_type' } } } };
  res = { json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Payment from Component', () => {
  it('should cancel transaction', () => {
    req.form.data.cancelTransaction = true;
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return json response', () => {
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if resultCode is not Pending', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const OrderMgr = require('dw/order/OrderMgr');
    req.form.data = JSON.stringify(req.form.data);
    adyenCheckout.createPaymentRequest.mockImplementation(() => ({
      resultCode: 'Not_Pending',
    }));
    paymentFromComponent(req, res, jest.fn());
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should not fail if resultCode is Pending', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const OrderMgr = require('dw/order/OrderMgr');
    req.form.data = JSON.stringify(req.form.data);
    adyenCheckout.createPaymentRequest.mockImplementation(() => ({
      resultCode: 'Pending',
    }));
    paymentFromComponent(req, res, jest.fn());
    expect(OrderMgr.failOrder).toBeCalledTimes(0);
  });
});
