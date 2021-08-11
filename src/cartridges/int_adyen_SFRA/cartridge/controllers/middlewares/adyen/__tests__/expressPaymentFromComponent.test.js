/* eslint-disable global-require */
let expressPaymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../index');
  expressPaymentFromComponent = adyen.expressPaymentFromComponent;
  jest.clearAllMocks();
  req = {
    currentCustomer: {
      addressBook: {
        preferredAddress: {
          countryCode: {},
        },
      }
    },
    form: { data: { paymentMethod: { type: 'mocked_type' } } } };
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Express Payment from Component', () => {
  it('should fail without default address', () => {
    delete req.currentCustomer.addressBook.preferredAddress;
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());

    expect(res.json.mock.calls).toMatchSnapshot();
  });

  it('should cancel transaction', () => {
    req.form.data.cancelTransaction = true;
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());

    expect(res.json.mock.calls).toMatchSnapshot();
  });

  it('should return json response', () => {
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
