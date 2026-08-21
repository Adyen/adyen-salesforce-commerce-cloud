/* eslint-disable global-require */

jest.mock(
  '*/cartridge/libs/libAuthenticationUtils',
  () => ({
    checkGivenCredentials: jest.fn(() => true),
    calculateHmacSignature: jest.fn(() => 'mocked_signature'),
  }),
  { virtual: true },
);

let checkAuth;
let AuthenticationUtils;

beforeEach(() => {
  jest.clearAllMocks();
  checkAuth = require('../checkNotificationAuth');
  AuthenticationUtils = require('*/cartridge/libs/libAuthenticationUtils');
});

afterEach(() => {
  jest.resetModules();
});

describe('validateHmacSignature', () => {
  it('should accept a notification whose signature matches', () => {
    const req = {
      form: { 'additionalData.hmacSignature': 'mocked_signature' },
    };
    expect(checkAuth.validateHmacSignature(req)).toBe(true);
  });
  it('should reject a notification whose signature does not match', () => {
    const req = {
      form: { 'additionalData.hmacSignature': 'mocked_other_signature' },
    };
    expect(checkAuth.validateHmacSignature(req)).toBe(false);
  });
  it('should reject a notification without a signature instead of throwing', () => {
    const req = { form: { merchantReference: 'mocked_reference' } };
    expect(checkAuth.validateHmacSignature(req)).toBe(false);
  });
  it('should reject a notification without a form instead of throwing', () => {
    expect(checkAuth.validateHmacSignature({})).toBe(false);
  });
  it('should reject a notification when the merchant signature could not be calculated', () => {
    AuthenticationUtils.calculateHmacSignature.mockImplementation(() => ({
      error: true,
    }));
    const req = {
      form: { 'additionalData.hmacSignature': 'mocked_signature' },
    };
    expect(checkAuth.validateHmacSignature(req)).toBe(false);
  });
});
