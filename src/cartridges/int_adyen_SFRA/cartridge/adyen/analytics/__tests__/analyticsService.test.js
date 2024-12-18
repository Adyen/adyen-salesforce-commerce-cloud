const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { createCheckoutAttemptId } = require('../analyticsService');

describe('createCheckoutAttemptId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return checkoutAttemptId when the execute function is successful', () => {
    const mockCheckoutAttemptId = 'test-checkout-attempt-id';
    AdyenHelper.getService.mockImplementationOnce(() => ({
      getURL: jest.fn(() => 'mocked_service_url'),
      setURL: jest.fn(),
      addHeader: jest.fn(),
      call: jest.fn(() => ({
        status: '200',
        isOk: jest.fn(() => true),
        object: {
          getText: jest.fn(() =>
            `{"checkoutAttemptId":"${mockCheckoutAttemptId}"}`),

        },
      }))
    }));

    const result = createCheckoutAttemptId();
    expect(result).toEqual({ data: mockCheckoutAttemptId });
  });

  it('should return an error object and log error when execute throws an error', () => {
    AdyenHelper.getService.mockImplementationOnce(() => ({
      getURL: jest.fn(() => 'mocked_service_url'),
      setURL: jest.fn(),
      addHeader: jest.fn(),
      call: jest.fn(() => ({
        status: 'failed',
        isOk: jest.fn(() => false),
        getError: jest.fn(() => ({
          toString: jest.fn(() => '500')
        })),
        getStatus: jest.fn(() => 'failed'),
        getErrorMessage: jest.fn(() => 'Service error'),
        getMsg: jest.fn(() => 'Service error'),
      }))
    }));
    const mockError = new Error('AdyenAnalytics service call error code 500 Error => ResponseStatus: failed | ResponseErrorText: Service error | ResponseText: Service error');
    const result = createCheckoutAttemptId();

      expect(AdyenLogs.error_log).toHaveBeenCalledWith(
        'createCheckoutAttemptId for /analytics call failed:', mockError
      );
      expect(result).toEqual({ error: true });
  });
});
