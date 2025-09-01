/* eslint-disable global-require */

// Mock dependencies
jest.mock('dw/order/OrderMgr', () => ({
  cancelOrder: jest.fn(),
}));

const CAPTURE_FAILED = require('../CAPTURE_FAILED');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CAPTURE_FAILED eventHandler', () => {
  let mockOrder;
  let mockCustomObj;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      setPaymentStatus: jest.fn(),
      trackOrderChange: jest.fn(),
    };
  });

  describe('handle function', () => {
    it('should handle successful webhook - set payment status, track change, cancel order, and log', () => {
      mockCustomObj = {
        custom: {
          success: 'true'
        }
      };
      CAPTURE_FAILED.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_NOTPAID);
      expect(mockOrder.trackOrderChange).toHaveBeenCalledWith('Capture failed, cancelling order');
      expect(OrderMgr.cancelOrder).toHaveBeenCalledWith(mockOrder);
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Capture failed for order TEST-ORDER-123');
    });

    it('should only log when webhook is not successful', () => {
      mockCustomObj = {
        custom: {
          success: 'false'
        }
      };
      CAPTURE_FAILED.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.trackOrderChange).not.toHaveBeenCalled();
      expect(OrderMgr.cancelOrder).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Capture failed for order TEST-ORDER-123');
    });

    it('should only log when customObj is null', () => {
      CAPTURE_FAILED.handle({ order: mockOrder, customObj: null });
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.trackOrderChange).not.toHaveBeenCalled();
      expect(OrderMgr.cancelOrder).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Capture failed for order TEST-ORDER-123');
    });
  });
});
