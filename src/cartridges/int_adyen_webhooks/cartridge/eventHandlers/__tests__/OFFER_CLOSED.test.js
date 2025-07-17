const OFFER_CLOSED = require('../OFFER_CLOSED');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('OFFER_CLOSED eventHandler', () => {
  it('should log the webhook setup info', () => {
    OFFER_CLOSED.handle();
    expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, OFFER_CLOSED');
  });
});
