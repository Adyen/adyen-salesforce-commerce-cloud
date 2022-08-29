const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function makePartialPayment(req, res, next) {
  try {
    const request = JSON.parse(req.body);

    const { paymentMethod, splitPaymentsOrder, amount } = request;

    const partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount,
      reference: 'partialPaymentRef',
      paymentMethod,
      order: splitPaymentsOrder,
    };

    const response = adyenCheckout.doPaymentsCall(0, 0, partialPaymentRequest);
    Logger.getLogger('Adyen').error(
      `partial response ${JSON.stringify(response)}`,
    );
    Transaction.wrap(() => {
      session.privacy.giftCardResponse = JSON.stringify({
        pspReference: response.pspReference,
        ...response.order,
        ...response.amount,
      }); // entire response exceeds string length
    });
    Logger.getLogger('Adyen').error(
      `session.privacy.giftCardResponse ${session.privacy.giftCardResponse}`,
    );

    const remainingAmount = new Money(
      response.order.remainingAmount.value,
      response.order.remainingAmount.currency,
    ).divide(100);
    response.remainingAmountFormatted = remainingAmount.toFormattedString();
    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to create partial payment');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = makePartialPayment;
