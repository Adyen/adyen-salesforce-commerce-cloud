/* eslint-disable global-require */
let checkBalance;
let res;
let req = {
  form: {
    data: {
      paymentMethod: 'givex'
    }
  }
}

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  checkBalance = adyen.checkBalance;
  jest.clearAllMocks();
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('check balance', () => {
  it('should send successful response', async () => {
    checkBalance(req, res, jest.fn());
    expect(res.json).toHaveBeenCalled();
  });
});
