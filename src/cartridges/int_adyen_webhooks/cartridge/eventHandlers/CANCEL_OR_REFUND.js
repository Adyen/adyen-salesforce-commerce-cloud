const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle() {
    AdyenLogs.info_log('New webhook setup triggering, CANCEL_OR_REFUND');
}

module.exports = { handle };
