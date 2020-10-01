jest.mock('../payment');
jest.mock('../errorHandler', () => ({
  toggle3DS2Error: jest.fn(),
  handlePaymentError: jest.fn()
}))

const createAuthorization = require("../auth")

let req;
let session;
let res;
let adyenCheckout;
let URLUtils;
let handlePaymentsCall;
let toggle3DS2Error;

beforeEach(() => {
  jest.clearAllMocks();

  req = {
    form: {
      resultCode: 'Authorized',
      stateData: {details: 'mocked details'}
    },
    locale: {
      id: 'mocked_locale'
    }
  }
  res = { redirect: jest.fn() }
  session = { privacy: { orderNo: 'mocked_orderNo', paymentMethod: 'mocked_paymentMethod' } }
  handlePaymentsCall = require('../payment');
  toggle3DS2Error = require('../errorHandler').toggle3DS2Error;
})

describe('Auth', () => {
  it('should handle 3ds2 auth when challenge shopper', () => {
    req.form.resultCode = 'ChallengeShopper'
    req.form.challengeResult = true

    createAuthorization(session, { req, res, next: jest.fn() })
    expect(handlePaymentsCall.mock.calls).toMatchSnapshot()
  })

  it('should handle 3ds2 auth when has fingerprint', () => {
    req.form.resultCode = 'IdentifyShopper'
    req.form.fingerprintResult = true

    createAuthorization(session, { req, res, next: jest.fn() })
    expect(handlePaymentsCall.mock.calls).toMatchSnapshot()
  })
  it('should handle 3ds2 error', () => {
    req.form.resultCode = 'NOT_AUTHORIZED'
    createAuthorization(session, { req, res, next: jest.fn() })
    expect(toggle3DS2Error.mock.calls).toMatchSnapshot()
  })
})