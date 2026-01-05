const OFFER_CLOSED = require('../OFFER_CLOSED');
const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('OFFER_CLOSED eventHandler', () => {
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
    it('should set payment status to NOTPAID, track change, fail order, and log', () => {
      OFFER_CLOSED.handle({ order: mockOrder });
      expect(mockOrder.setPaymentStatus).toHaveBeenCalledWith(Order.PAYMENT_STATUS_NOTPAID);
      expect(mockOrder.trackOrderChange).toHaveBeenCalledWith('Offer closed, failing order');
      expect(AdyenLogs.info_log).toHaveBeenCalledWith('Offer closed for order TEST-ORDER-123 and updated to status NOT PAID.');
    });
  });
});
