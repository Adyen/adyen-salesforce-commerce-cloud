const callCreateSession = require('../sessions');
const { createSession } = require('*/cartridge/scripts/adyenSessions');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');

let res;
let req;
const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  res = {
    json: jest.fn(),
  };

  req = {
    locale: 'en_US',
    currentCustomer: '12321',
  };
});

describe('Create Session', () => {
  it('Should fail and log error if session creation fails', () => {
    createSession.mockImplementationOnce(() => {throw new Error('mock_error')});
    callCreateSession(req, res, next);
    expect(res.json.mock.calls.length).toBe(0);
    expect(next.mock.calls.length).toBe(1);
  })


  it('Should return session json after successful session creation', () => {
    createSession.mockImplementationOnce(() => {
      return {
        id: 'mocked_id',
        sessionData: 'mocked_session_data',
      }
    });
    AdyenHelper.getLoadingContext.mockImplementationOnce(() => { return 'http://test.com/'});
    callCreateSession(req, res, next);
    expect(res.json.mock.calls.length).toBe(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 'mocked_id',
      sessionData: 'mocked_session_data',
      imagePath: 'http://test.com/images/logos/medium/',
      adyenDescriptions: paymentMethodDescriptions,
      adyenConnectedTerminals: {foo: "bar"},
    });
    expect(next.mock.calls.length).toBe(1);
  })
})
