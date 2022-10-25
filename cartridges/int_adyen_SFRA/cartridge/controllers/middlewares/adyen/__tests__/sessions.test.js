"use strict";

var callCreateSession = require('../sessions');
var _require = require('*/cartridge/scripts/adyenSessions'),
  createSession = _require.createSession;
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');
var res;
var req;
var next = jest.fn();
beforeEach(function () {
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  req = {
    locale: 'en_US',
    currentCustomer: '12321'
  };
});
describe('Create Session', function () {
  it('Should fail and log error if session creation fails', function () {
    createSession.mockImplementationOnce(function () {
      throw new Error('mock_error');
    });
    callCreateSession(req, res, next);
    expect(res.json.mock.calls.length).toBe(0);
    expect(next.mock.calls.length).toBe(1);
  });
  it('Should return session json after successful session creation', function () {
    createSession.mockImplementationOnce(function () {
      return {
        id: 'mocked_id',
        sessionData: 'mocked_session_data'
      };
    });
    AdyenHelper.getLoadingContext.mockImplementationOnce(function () {
      return 'http://test.com/';
    });
    callCreateSession(req, res, next);
    expect(res.json.mock.calls.length).toBe(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 'mocked_id',
      sessionData: 'mocked_session_data',
      imagePath: 'http://test.com/images/logos/medium/',
      adyenDescriptions: paymentMethodDescriptions,
      adyenConnectedTerminals: {
        foo: "bar"
      }
    });
    expect(next.mock.calls.length).toBe(1);
  });
});