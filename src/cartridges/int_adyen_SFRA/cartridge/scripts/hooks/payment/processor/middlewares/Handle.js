const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function Handle(basket, paymentInformation) {
    const currentBasket = basket;
    const cardErrors = {};
    const serverErrors = [];
    Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
            currentBasket.removePaymentInstrument(item);
        });
        const paymentInstrument = currentBasket.createPaymentInstrument(
            constants.METHOD_ADYEN_COMPONENT,
            currentBasket.totalGrossPrice,
        );
        paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
        paymentInstrument.custom.adyenPaymentMethod =
            paymentInformation.adyenPaymentMethod;

        if (paymentInformation.isCreditCard) {
            const sfccCardType = AdyenHelper.getSFCCCardType(
                paymentInformation.cardType,
            );
            const tokenID = AdyenHelper.getCardToken(
                paymentInformation.storedPaymentUUID,
                customer,
            );

            paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
            paymentInstrument.setCreditCardType(sfccCardType);

            if (tokenID) {
                paymentInstrument.setCreditCardExpirationMonth(
                    paymentInformation.expirationMonth.value,
                );
                paymentInstrument.setCreditCardExpirationYear(
                    paymentInformation.expirationYear.value,
                );
                paymentInstrument.setCreditCardToken(tokenID);
            }
        } else {
            // Local payment data
            if (paymentInformation.adyenIssuerName) {
                paymentInstrument.custom.adyenIssuerName =
                    paymentInformation.adyenIssuerName;
            }
        }
    });

    return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = Handle;

// export default Handle;