const ORDER_OPENED = require('../ORDER_OPENED');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('ORDER_OPENED eventHandler', () => {
  let mockOrder;
  let mockCustomObj;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
    };
  });

  describe('handle function', () => {
    it('should log order opened when webhook is successful', () => {
      mockCustomObj = {
        custom: {
          success: 'true'
        }
      };
      ORDER_OPENED.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 opened for partial payments');
    });

    it('should not log when webhook is not successful', () => {
      mockCustomObj = {
        custom: {
          success: 'false'
        }
      };
      ORDER_OPENED.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });
  });
});
