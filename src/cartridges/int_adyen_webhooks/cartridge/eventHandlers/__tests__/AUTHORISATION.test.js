/* eslint-disable global-require */

// Mock dependencies
jest.mock('dw/order/Order');
jest.mock('dw/order/OrderMgr', () => ({
  undoFailOrder: jest.fn()
}));
jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn()
}));
jest.mock('../../utils/paymentUtils', () => ({
  placeOrder: jest.fn()
}));

const AUTHORISATION = require('../AUTHORISATION');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { placeOrder } = require('../../utils/paymentUtils');

// Mock constants
Order.PAYMENT_STATUS_PAID = 'PAID';
Order.PAYMENT_STATUS_PARTPAID = 'PARTPAID';
Order.PAYMENT_STATUS_NOTPAID = 'NOTPAID';
Order.ORDER_STATUS_FAILED = 'FAILED';
Order.EXPORT_STATUS_READY = 'READY';
Order.EXPORT_STATUS_NOTEXPORTED = 'NOTEXPORTED';
Order.CONFIRMATION_STATUS_CONFIRMED = 'CONFIRMED';
Order.CONFIRMATION_STATUS_NOTCONFIRMED = 'NOTCONFIRMED';

describe('AUTHORISATION eventHandler', () => {
  let mockOrder;
  let mockCustomObj;
  let mockResult;
  let totalAmount;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock order object
    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      paymentStatus: { value: 'CREATED' },
      status: { value: 'CREATED' },
      setPaymentStatus: jest.fn(),
      setExportStatus: jest.fn(),
      setConfirmationStatus: jest.fn(),
      trackOrderChange: jest.fn(),
      custom: {}
    };

    // Mock custom object from webhook
    mockCustomObj = {
      custom: {
        success: 'true',
        value: '100.00',
        eventCode: 'AUTHORISATION'
      }
    };

    // Mock result object
    mockResult = {
      SubmitOrder: false
    };

    totalAmount = 100.00;

    // Mock placeOrder function
    placeOrder.mockReturnValue({ error: false });
  });

  describe('handle function - successful authorization scenarios', () => {
    it('should handle duplicate callback when order is already paid', () => {
      mockOrder.paymentStatus.value = Order.PAYMENT_STATUS_PAID;
      
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(AdyenLogs.info_log).toHaveBeenCalledWith(
        'Duplicate callback received for order TEST-ORDER-123.'
      );
      expect(mockOrder.custom.Adyen_eventCode).toBe('AUTHORISATION');
      expect(mockOrder.custom.Adyen_value).toBe('100');
      expect(result).toEqual({ success: true, isAdyenPayment: true });
    });

    it('should handle partial payment scenario', () => {
      mockCustomObj.custom.value = '50.00';
      totalAmount = 100.00;
      
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_PARTPAID);
      expect(AdyenLogs.info_log).toHaveBeenCalledWith(
        'Partial amount 50.00 received for order number TEST-ORDER-123 with total amount 100'
      );
      expect(mockOrder.custom.Adyen_eventCode).toBe('AUTHORISATION');
      expect(mockOrder.custom.Adyen_value).toBe('50');
      expect(result).toEqual({ success: true, isAdyenPayment: true });
    });

    it('should handle successful full payment authorization', () => {
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(placeOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_PAID);
      expect(mockOrder.setExportStatus).toHaveBeenCalledWith(Order.EXPORT_STATUS_READY);
      expect(mockOrder.setConfirmationStatus).toHaveBeenCalledWith(Order.CONFIRMATION_STATUS_CONFIRMED);
      expect(AdyenLogs.info_log).toHaveBeenCalledWith(
        'Order TEST-ORDER-123 updated to status PAID.'
      );
      expect(mockResult.SubmitOrder).toBe(true);
      expect(mockOrder.custom.Adyen_eventCode).toBe('AUTHORISATION');
      expect(mockOrder.custom.Adyen_value).toBe('100');
      expect(result).toEqual({ success: true, isAdyenPayment: true });
    });

    it('should handle failed order recovery scenario', () => {
      mockOrder.status.value = Order.ORDER_STATUS_FAILED;
      
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(OrderMgr.undoFailOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockOrder.trackOrderChange).toHaveBeenCalledWith(
        'Authorisation webhook received for failed order, moving order status to CREATED'
      );
      expect(placeOrder).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual({ success: true, isAdyenPayment: true });
    });

    it('should not recover failed order if amounts do not match', () => {
      mockOrder.status.value = Order.ORDER_STATUS_FAILED;
      mockCustomObj.custom.value = '50.00'; // Different from totalAmount
      
      AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(OrderMgr.undoFailOrder).not.toHaveBeenCalled();
      expect(mockOrder.trackOrderChange).not.toHaveBeenCalled();
    });

    it('should handle placeOrder failure', () => {
      placeOrder.mockReturnValue({ error: true });
      
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(placeOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalledWith(Order.PAYMENT_STATUS_PAID);
      expect(mockOrder.setExportStatus).not.toHaveBeenCalledWith(Order.EXPORT_STATUS_READY);
      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalledWith(Order.CONFIRMATION_STATUS_CONFIRMED);
      expect(mockResult.SubmitOrder).toBe(false);
      expect(result).toEqual({ success: true, isAdyenPayment: true });
    });
  });

  describe('handle function - failed authorization scenarios', () => {
    beforeEach(() => {
      mockCustomObj.custom.success = 'false';
    });

    it('should handle failed authorization', () => {
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(AdyenLogs.info_log).toHaveBeenCalledWith(
        'Authorization for order TEST-ORDER-123 was not successful - no update.'
      );
      expect(result).toEqual({ success: false, isAdyenPayment: true });
    });

    it('should update failed order status when order is already failed', () => {
      mockOrder.status.value = Order.ORDER_STATUS_FAILED;
      
      const result = AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(mockOrder.setConfirmationStatus).toHaveBeenCalledWith(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_NOTPAID);
      expect(mockOrder.setExportStatus).toHaveBeenCalledWith(Order.EXPORT_STATUS_NOTEXPORTED);
      expect(result).toEqual({ success: false, isAdyenPayment: true });
    });

    it('should not update order status when order is not failed', () => {
      mockOrder.status.value = 'CREATED';
      
      AUTHORISATION.handle({
        order: mockOrder,
        customObj: mockCustomObj,
        result: mockResult,
        totalAmount
      });

      expect(mockOrder.setConfirmationStatus).not.toHaveBeenCalled();
      expect(mockOrder.setPaymentStatus).not.toHaveBeenCalled();
      expect(mockOrder.setExportStatus).not.toHaveBeenCalled();
    });
  });
});
