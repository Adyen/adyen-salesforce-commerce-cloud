const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');

function handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];


//  let paymentInstrument; //for 1 PM
  Transaction.wrap(() => {
     collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
        if(!item.custom.adyenSplitPaymentsOrder) {
           currentBasket.removePaymentInstrument(item);
        }
     });

//     const paymentInstrument = currentBasket.createPaymentInstrument( //for separate PMs
//               constants.METHOD_ADYEN_COMPONENT,
//               currentBasket.totalGrossPrice,
//             );
//    if(!paymentInstrument) { //for 1 PM
        let paymentInstrument = currentBasket.createPaymentInstrument(
          constants.METHOD_ADYEN_COMPONENT,
          currentBasket.totalGrossPrice,
        );
//    }

     paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
          Logger.getLogger('Adyen').error('paymentInstrument for card payment ' + paymentInstrument);
          Logger.getLogger('Adyen').error('paymentInstrument.custom.adyenPaymentData ' + JSON.stringify(paymentInstrument.custom.adyenPaymentData));

//   if(paymentInformation.splitPaymentsOrder) { //for 1 payment processors
//      paymentInstrument.custom.adyenSplitPaymentsOrder = paymentInformation.splitPaymentsOrder;
//      paymentInstrument.custom.adyenPaymentMethod += ` + ${paymentInformation.adyenPaymentMethod}`;
//   } else {
//      paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;
//   }
     Logger.getLogger('Adyen').error('paymentInformation ' + JSON.stringify(paymentInformation));

     Logger.getLogger('Adyen').error('paymentInformation.splitPaymentsOrder ' + JSON.stringify(paymentInformation.splitPaymentsOrder));

     paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod; //for separate payment processor
     paymentInstrument.custom.adyenSplitPaymentsOrder = paymentInformation.splitPaymentsOrder;
          Logger.getLogger('Adyen').error('paymentInstrument.custom.adyenSplitPaymentsOrder ' + JSON.stringify(paymentInstrument.custom.adyenSplitPaymentsOrder));

     if (paymentInformation.isCreditCard) {
       // If the card wasn't a stored card we need to convert sfccCardType
       const sfccCardType = !paymentInformation.creditCardToken
         ? AdyenHelper.getSFCCCardType(paymentInformation.cardType)
         : paymentInformation.cardType;

       paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
       paymentInstrument.setCreditCardType(sfccCardType);

//        if(paymentInstrument.custom.adyenPaymentMethod.includes("split payment")) { //for 1 PM
//          paymentInstrument.custom.adyenPaymentMethod += ` ${sfccCardType}`;
//       }
//       else {
//        paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
//        }
        paymentInstrument.custom.adyenPaymentMethod = sfccCardType; //for separate PMs

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