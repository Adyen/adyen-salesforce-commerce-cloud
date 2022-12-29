"use strict";

/* eslint-disable global-require */
var createPartialPaymentsOrder;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  createPartialPaymentsOrder = adyen.partialPaymentsOrder;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn(),
    json: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('partial payments order', function () {
  it('should cache order data to reuse at payments', function () {
    createPartialPaymentsOrder(req, res, jest.fn());
    expect(session.privacy.partialPaymentData).toContain('remainingAmount');
  });
});