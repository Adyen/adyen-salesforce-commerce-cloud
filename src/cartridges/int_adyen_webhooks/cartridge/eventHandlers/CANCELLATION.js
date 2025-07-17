const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle() {
    AdyenLogs.info_log('New webhook setup triggering, CANCELLATION');
}

module.exports = { handle };
