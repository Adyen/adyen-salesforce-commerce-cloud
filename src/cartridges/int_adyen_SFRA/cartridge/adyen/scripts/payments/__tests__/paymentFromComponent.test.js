/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  paymentFromComponent = adyen.paymentFromComponent;
  jest.clearAllMocks();
  req = {
    form: {
      paymentMethod: 'method',
      data: {
        paymentMethod: {
          type: 'mocked_type'
        }
      }
    }
  };
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Payment from Component', () => {
  it('should cancel transaction', () => {
    const URLUtils = require('dw/web/URLUtils');

    req.form.data.cancelTransaction = true;
    req.form.data.merchantReference = 'mocked_merchantReference';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());

    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should return json response', () => {
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should authorize express payment with skipping summary page', () => {
    req.form.data.paymentMethod.type = 'applepay';
    req.form.data.paymentMethod.paymentType = 'express';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
