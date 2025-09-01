const CANCEL_OR_REFUND = require('../CANCEL_OR_REFUND');
const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CANCEL_OR_REFUND eventHandler', () => {
  let mockOrder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      orderNo: 'TEST-ORDER-123',
      setPaymentStatus: jest.fn(),
      trackOrderChange: jest.fn(),
    };
  });

  describe('handle function', () => {
    it('should set payment status to NOTPAID', () => {
      CANCEL_OR_REFUND.handle({ order: mockOrder });
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_NOTPAID);
      expect(mockOrder.trackOrderChange).toHaveBeenCalledWith('CANCEL_OR_REFUND notification received');
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 was cancelled or refunded.');
    });
  });
});
