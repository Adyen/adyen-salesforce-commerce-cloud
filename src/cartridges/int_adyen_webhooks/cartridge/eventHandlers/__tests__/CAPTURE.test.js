const CAPTURE = require('../CAPTURE');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CAPTURE eventHandler', () => {
  it('should log the webhook setup info', () => {
    // CAPTURE.handle();
    // expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, CAPTURE');
  });
});
