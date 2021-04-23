"use strict";

var handleFraudDetection = require('../fraud');

var order;
var req;
var res;
var emit;
beforeEach(function () {
  order = {};
  req = {
    session: {
      privacyCache: {
        set: jest.fn()
      }
    }
  };
  res = {
    json: jest.fn()
  };
  emit = jest.fn();
});
describe('Fraud', function () {
  it('should return json response with error when fraud status is "fail"', function () {
    var isSuccessful = handleFraudDetection({
      status: 'fail'
    }, order, {
      req: req,
      res: res
    }, emit);
    expect(isSuccessful).toBeFalsy();
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(emit).toHaveBeenCalledWith('route:Complete');
  });
  it('should succeed when fraud status is not "fail"', function () {
    var isSuccessful = handleFraudDetection({
      status: 'success'
    }, order, {
      req: req,
      res: res
    }, emit);
    expect(isSuccessful).toBeTruthy();
    expect(emit).toHaveBeenCalledTimes(0);
  });
});