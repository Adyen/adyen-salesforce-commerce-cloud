const DONATION = require('../DONATION');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('DONATION eventHandler', () => {
  let mockOrder;
  let mockCustomObj;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      custom: {},
    };
  });

  describe('handle function', () => {
    it('should set donation amount when webhook is successful', () => {
      mockCustomObj = {
        custom: {
          success: 'true',
          value: '5.50'
        }
      };
      DONATION.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.custom.Adyen_donationAmount).toBe(5.5);
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('should log failure when webhook is not successful', () => {
      mockCustomObj = {
        custom: {
          success: 'false',
          value: '5.50'
        }
      };
      DONATION.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.custom.Adyen_donationAmount).toBeUndefined();
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Donation failed for order TEST-ORDER-123');
    });

    it('should log failure when customObj is null', () => {
      DONATION.handle({ order: mockOrder, customObj: null });
      expect(mockOrder.custom.Adyen_donationAmount).toBeUndefined();
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Donation failed for order TEST-ORDER-123');
    });
  });
});
