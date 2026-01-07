const REFUND = require('../REFUND');
const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('REFUND eventHandler', () => {
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
    it('should set payment status to NOTPAID, track order change, and log refund', () => {
      REFUND.handle({ order: mockOrder });
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_NOTPAID);
      expect(mockOrder.trackOrderChange).toHaveBeenCalledWith('REFUND notification received');
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 was refunded.');
    });
  });
});
