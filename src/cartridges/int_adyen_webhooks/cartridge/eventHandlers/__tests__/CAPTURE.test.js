// Mock dependencies
jest.mock('dw/order/OrderMgr', () => ({
  undoCancelOrder: jest.fn(),
}));

const CAPTURE = require('../CAPTURE');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CAPTURE eventHandler', () => {
  let mockOrder;
  let mockCustomObj;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      status: { value: Order.ORDER_STATUS_CANCELLED },
      setPaymentStatus: jest.fn(),
      setExportStatus: jest.fn(),
      setConfirmationStatus: jest.fn(),
    };
  });

  describe('handle function', () => {
    it('should handle successful webhook with cancelled order - undo cancel, update statuses, and log', () => {
      mockCustomObj = {
        custom: {
          success: 'true'
        }
      };
      CAPTURE.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_PAID);
      expect(mockOrder.setExportStatus).toHaveBeenCalledWith(Order.EXPORT_STATUS_READY);
      expect(mockOrder.setConfirmationStatus).toHaveBeenCalledWith(Order.CONFIRMATION_STATUS_CONFIRMED);
      expect(OrderMgr.undoCancelOrder).toHaveBeenCalledWith(mockOrder);
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Undo failed capture, Order TEST-ORDER-123 updated to status PAID.');
    });

    it('should do nothing when webhook is successful but order is not cancelled', () => {
      mockCustomObj = {
        custom: {
          success: 'true'
        }
      };
      mockOrder.status.value = 'CREATED';
      CAPTURE.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(OrderMgr.undoCancelOrder).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('should do nothing when webhook is not successful', () => {
      mockCustomObj = {
        custom: {
          success: 'false'
        }
      };
      CAPTURE.handle({ order: mockOrder, customObj: mockCustomObj });
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(OrderMgr.undoCancelOrder).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('should do nothing when customObj is null', () => {
      CAPTURE.handle({ order: mockOrder, customObj: null });
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(OrderMgr.undoCancelOrder).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });
  });
});
