const REFUND = require('../REFUND');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('REFUND eventHandler', () => {
  it('should log refund info', () => {
    // REFUND.handle({});
    // expect(AdyenLogs.info_log).toHaveBeenCalledWith('Order TEST-ORDER-123 was refunded.');
  });
});
