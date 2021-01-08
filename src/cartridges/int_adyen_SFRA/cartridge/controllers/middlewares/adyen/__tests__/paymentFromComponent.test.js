/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  paymentFromComponent = adyen.paymentFromComponent;
  jest.clearAllMocks();
  req = { form: { data: { paymentMethod: { type: 'mocked_type' } } } };
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Payment from Component', () => {
  it('should cancel transaction', () => {
    const URLUtils = require('dw/web/URLUtils');

    req.form.data.cancelTransaction = true;
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());

    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should return json response', () => {
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
