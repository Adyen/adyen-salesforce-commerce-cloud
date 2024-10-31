const { createCheckoutAttemptId } = require('../analyticsService');

const AdyenHelper = {
  getApplicationInfo: jest.fn(),
};

const execute = jest.fn();
const constants = {
  SERVICE: {
    ADYEN_ANALYTICS: 'ADYEN_ANALYTICS',
  },
};

const AdyenLogs = {
  error_log: jest.fn(),
};

global.AdyenHelper = AdyenHelper;
global.execute = execute;
global.constants = constants;
global.AdyenLogs = AdyenLogs;

describe('createCheckoutAttemptId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return checkoutAttemptId when the execute function is successful', () => {
    const mockCheckoutAttemptId = 'test-checkout-attempt-id';
    const mockApplicationInfo = { name: 'testApp' };

    AdyenHelper.getApplicationInfo.mockReturnValue(mockApplicationInfo);
    execute.mockReturnValue({ checkoutAttemptId: mockCheckoutAttemptId });

    const result = createCheckoutAttemptId();

    setTimeout(() => {
      expect(AdyenHelper.getApplicationInfo).toHaveBeenCalled();
      expect(execute).toHaveBeenCalledWith(constants.SERVICE.ADYEN_ANALYTICS, {
        applicationInfo: mockApplicationInfo,
        channel: 'Web',
        platform: 'Web',
      });
      expect(result).toEqual({ data: mockCheckoutAttemptId });
    }, 0)
  });

  it('should return an error object and log error when execute throws an error', () => {
    const mockError = new Error('Execution failed');
    AdyenHelper.getApplicationInfo.mockReturnValue({});
    execute.mockImplementation(() => {
      throw mockError;
    });

    const result = createCheckoutAttemptId();

    setTimeout(() => {
      expect(AdyenHelper.getApplicationInfo).toHaveBeenCalled();
      expect(AdyenLogs.error_log).toHaveBeenCalledWith(
        'createCheckoutAttemptId for /analytics call failed:',
        mockError
      );
      expect(result).toEqual({ error: true });
    }, 0)
  });
});