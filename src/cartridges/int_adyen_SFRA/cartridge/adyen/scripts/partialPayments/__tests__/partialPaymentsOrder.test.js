/* eslint-disable global-require */
let createPartialPaymentsOrder;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  createPartialPaymentsOrder = adyen.partialPaymentsOrder;
  jest.clearAllMocks();
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('partial payments order', () => {
  it('should cache order data to reuse at payments', () => {
    createPartialPaymentsOrder(req, res, jest.fn());
    expect(session.privacy.partialPaymentData).toContain('remainingAmount');
  });
});
