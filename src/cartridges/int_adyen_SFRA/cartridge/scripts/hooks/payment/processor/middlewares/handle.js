const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');

function fillPaymentInstrument(paymentInstrument, paymentInformation) {
//     paymentInstrument.custom.adyenPaymentData = paymentInstrument.custom.adyenPaymentData ? {...paymentInstrument.custom.adyenPaymentData, ...paymentInformation.stateData} : paymentInformation.stateData;
     paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
//          Logger.getLogger('Adyen').error('after  adyenPaymentData');
     if(paymentInformation.splitPaymentsOrder) {
        paymentInstrument.custom.adyenSplitPaymentsOrder = paymentInformation.splitPaymentsOrder;
        paymentInstrument.custom.adyenPaymentMethod += ` + ${paymentInformation.adyenPaymentMethod}`;
     } else {
        paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;
     }
     Logger.getLogger('Adyen').error('splitPaymentsOrder in handle ' + JSON.stringify(paymentInformation.splitPaymentsOrder));

     if (paymentInformation.isCreditCard) {
       // If the card wasn't a stored card we need to convert sfccCardType
       const sfccCardType = !paymentInformation.creditCardToken
         ? AdyenHelper.getSFCCCardType(paymentInformation.cardType)
         : paymentInformation.cardType;

       paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
       paymentInstrument.setCreditCardType(sfccCardType);

       if(paymentInstrument.custom.adyenPaymentMethod.includes("split payment")) {
          paymentInstrument.custom.adyenPaymentMethod += ` ${sfccCardType}`;
       }
       else {
        paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
       }

       if (paymentInformation.creditCardToken) {
         paymentInstrument.setCreditCardExpirationMonth(
           paymentInformation.expirationMonth,
         );
         paymentInstrument.setCreditCardExpirationYear(
           paymentInformation.expirationYear,
         );
         paymentInstrument.setCreditCardToken(
           paymentInformation.creditCardToken,
         );
       }
    }
}

function handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];

  let paymentInstrument;
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
        if(item.custom.adyenSplitPaymentsOrder) {
          paymentInstrument = item;
          return;
        }
        else {
          currentBasket.removePaymentInstrument(item);
        }
    });
    if(!paymentInstrument) {
        paymentInstrument = currentBasket.createPaymentInstrument(
          constants.METHOD_ADYEN_COMPONENT,
          currentBasket.totalGrossPrice,
        );
    };
    Logger.getLogger('Adyen').error('about to fill pm');
    fillPaymentInstrument(paymentInstrument, paymentInformation);
  });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;