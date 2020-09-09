/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  paymentFromComponent = adyen.paymentFromComponent;
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
    const expected = paymentFromComponent(req, res, jest.fn());
    expect(expected).toEqual({});
  });
  it('should return json response', () => {
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
