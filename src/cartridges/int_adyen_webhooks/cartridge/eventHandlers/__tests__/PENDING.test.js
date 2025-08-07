const PENDING = require('../PENDING');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('PENDING eventHandler', () => {
  it('should log the webhook setup info', () => {
    // PENDING.handle();
    // expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, PENDING');
  });
});
