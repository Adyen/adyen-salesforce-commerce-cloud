const CANCEL_OR_REFUND = require('../CANCEL_OR_REFUND');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('CANCEL_OR_REFUND eventHandler', () => {
  it('should log the webhook setup info', () => {
    CANCEL_OR_REFUND.handle();
    expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, CANCEL_OR_REFUND');
  });
});
