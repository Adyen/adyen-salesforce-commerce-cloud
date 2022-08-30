const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function makePartialPayment(req, res, next) {
  try {
    const request = JSON.parse(req.body);

    const { paymentMethod, partialPaymentsOrder, amount } = request;

    const partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount,
      reference: 'partialPaymentRef',
      paymentMethod,
      order: partialPaymentsOrder,
    };

    const response = adyenCheckout.doPaymentsCall(
      null,
      null,
      partialPaymentRequest,
    ); // no order created yet and no PI needed (for giftcards it will be created on Order level)
    Transaction.wrap(() => {
      session.privacy.giftCardResponse = JSON.stringify({
        pspReference: response.pspReference,
        ...response.order,
        ...response.amount,
      }); // entire response exceeds string length
    });

    const remainingAmount = new Money(
      response.order.remainingAmount.value,
      response.order.remainingAmount.currency,
    ).divide(100);
    response.remainingAmountFormatted = remainingAmount.toFormattedString();
    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error(
      `Failed to create partial payment.. ${error.toString()}`,
    );
  }
  return next();
}

module.exports = makePartialPayment;
