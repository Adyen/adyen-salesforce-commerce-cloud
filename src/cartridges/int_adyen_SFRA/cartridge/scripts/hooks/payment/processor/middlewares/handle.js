const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');

function handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];

/* for separate PMs*/
//  let paymentInstrument;
//  Transaction.wrap(() => {
//     collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
//        Logger.getLogger('Adyen').error('item ' + item);
//        if(!item.custom.adyenSplitPaymentsOrder) {
//           Logger.getLogger('Adyen').error('removed ' + item);
//           currentBasket.removePaymentInstrument(item);
//        }
//     });

  let paymentInstrument; //for 1 PM
  Transaction.wrap(() => {
     collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
         if(item.custom.adyenSplitPaymentsOrder) {
               paymentInstrument = item;
               return;
             }
             else {
                     Logger.getLogger('Adyen').error('removing item ' + item);
                       currentBasket.removePaymentInstrument(item);
             }
     });
//     const paymentInstrument = currentBasket.createPaymentInstrument( //for separate PMs
//               constants.METHOD_ADYEN_COMPONENT,
//               currentBasket.totalGrossPrice,
//             );
    if(!paymentInstrument) { //for 1 PM
         paymentInstrument = currentBasket.createPaymentInstrument(
          constants.METHOD_ADYEN_COMPONENT,
          currentBasket.totalGrossPrice,
        );
    }

     paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
          Logger.getLogger('Adyen').error('paymentInstrument.custom.adyenPaymentData ' + JSON.stringify(paymentInstrument.custom.adyenPaymentData));
          Logger.getLogger('Adyen').error('paymentInformation ' + JSON.stringify(paymentInformation));

   if(paymentInformation.splitPaymentsOrder) { //for separate payment processors
      paymentInstrument.custom.adyenSplitPaymentsOrder = paymentInformation.splitPaymentsOrder;
      paymentInstrument.custom.adyenPaymentMethod += ` + ${paymentInformation.adyenPaymentMethod}`;
   } else {
      paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;
   }
//     paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod; //for 1 payment processor

     if (paymentInformation.isCreditCard) {
       // If the card wasn't a stored card we need to convert sfccCardType
       const sfccCardType = !paymentInformation.creditCardToken
         ? AdyenHelper.getSFCCCardType(paymentInformation.cardType)
         : paymentInformation.cardType;

       paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
       paymentInstrument.setCreditCardType(sfccCardType);

        if(paymentInstrument.custom.adyenPaymentMethod.includes("split payment")) { //for 1 PM
          paymentInstrument.custom.adyenPaymentMethod += ` ${sfccCardType}`;
       }
       else {
        paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
        }
//        paymentInstrument.custom.adyenPaymentMethod = sfccCardType; //for separate PMs

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
   });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;