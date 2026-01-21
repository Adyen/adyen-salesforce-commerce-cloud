const PENDING = require('../PENDING');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('PENDING eventHandler', () => {
  let mockOrder;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder = {
      orderNo: 'TEST-ORDER-123',
    };
  });

  describe('handle function', () => {
    it('should log pending status and return pending object', () => {
      const result = PENDING.handle({ order: mockOrder });
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 was in pending status.');
      expect(result).toEqual({ pending: true });
    });
  });
});
