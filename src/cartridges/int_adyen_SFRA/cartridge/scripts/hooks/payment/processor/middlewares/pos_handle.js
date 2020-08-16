const Transaction = require('dw/system/Transaction');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function pos_handle(basket) {
    Transaction.wrap(() => {
        collections.forEach(basket.getPaymentInstruments(), (item) => {
            basket.removePaymentInstrument(item);
        });

        const paymentInstrument = basket.createPaymentInstrument(
            constants.METHOD_ADYEN_POS,
            basket.totalGrossPrice,
        );
        paymentInstrument.custom.adyenPaymentMethod = 'POS Terminal';
    });

    return { error: false };
}

module.exports = pos_handle;
