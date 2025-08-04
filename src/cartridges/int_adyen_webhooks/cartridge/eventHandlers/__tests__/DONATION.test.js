const DONATION = require('../DONATION');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('DONATION eventHandler', () => {
  it('should log donation info when failed', () => {
    DONATION.handle();
    expect(AdyenLogs.info_log).toHaveBeenCalledWith('Donation failed for order TEST-ORDER-123');
  });
});
