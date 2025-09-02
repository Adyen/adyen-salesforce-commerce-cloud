// Mock dependencies
jest.mock('../../utils/paymentUtils', () => ({
  placeOrder: jest.fn(),
}));

const ORDER_CLOSED = require('../ORDER_CLOSED');
const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { placeOrder } = require('../../utils/paymentUtils');

describe('ORDER_CLOSED eventHandler', () => {
  let mockOrder;
  let mockCustomObj;
  let totalAmount;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      setPaymentStatus: jest.fn(),
      setExportStatus: jest.fn(),
      setConfirmationStatus: jest.fn(),
    };

    totalAmount = 100.00;
  });

  describe('handle function', () => {
    it('should place order and update statuses when webhook is successful', () => {
      mockCustomObj = {
        custom: {
          success: 'true',
          value: '100.00'
        }
      };
      placeOrder.mockReturnValue({ error: false });
      ORDER_CLOSED.handle({ order: mockOrder, customObj: mockCustomObj, totalAmount });
      expect(placeOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_PAID);
      expect(mockOrder.setExportStatus).toHaveBeenCalledWith(Order.EXPORT_STATUS_READY);
      expect(mockOrder.setConfirmationStatus).toHaveBeenCalledWith(Order.CONFIRMATION_STATUS_CONFIRMED);
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 placed and closed');
    });

    it('should not update statuses when placeOrder returns error', () => {
      mockCustomObj = {
        custom: {
          success: 'true',
          value: '100.00'
        }
      };
      placeOrder.mockReturnValue({ error: true });
      ORDER_CLOSED.handle({ order: mockOrder, customObj: mockCustomObj, totalAmount });
      expect(placeOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('should do nothing when webhook is not successful', () => {
      mockCustomObj = {
        custom: {
          success: 'false',
          value: '100.00'
        }
      };
      ORDER_CLOSED.handle({ order: mockOrder, customObj: mockCustomObj, totalAmount });
      expect(placeOrder).not.toHaveBeenCalled();
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });
  });
});
