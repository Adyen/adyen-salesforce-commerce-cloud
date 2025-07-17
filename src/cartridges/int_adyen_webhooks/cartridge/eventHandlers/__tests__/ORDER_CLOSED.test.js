const ORDER_CLOSED = require('../ORDER_CLOSED');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('ORDER_CLOSED eventHandler', () => {
  it('should log the webhook setup info', () => {
    ORDER_CLOSED.handle();
    expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, ORDER_CLOSED');
  });
});
