const ORDER_OPENED = require('../ORDER_OPENED');

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => ({
  info_log: jest.fn(),
}));
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

describe('ORDER_OPENED eventHandler', () => {
  it('should log the webhook setup info', () => {
    // ORDER_OPENED.handle();
    // expect(AdyenLogs.info_log).toHaveBeenCalledWith('New webhook setup triggering, ORDER_OPENED');
  });
});
