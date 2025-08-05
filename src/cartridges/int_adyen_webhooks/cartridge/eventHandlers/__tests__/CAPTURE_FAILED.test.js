const CAPTURE_FAILED = require('../CAPTURE_FAILED');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CAPTURE_FAILED eventHandler', () => {
  it('should log the webhook setup info', () => {
    // CAPTURE_FAILED.handle();
    // expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, CAPTURE_FAILED');
  });
});
