const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function getDivisorForCurrency(amount) {
    let fractionDigits = AdyenHelper.getFractionDigits(
      amount.currencyCode,
    );
    let divideBy = 1;
    while (fractionDigits > 0) {
      divideBy *= 10;
      fractionDigits -= 1;
    }
    return divideBy;
}

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
        giftCardpspReference: response.pspReference,
        orderPSPReference: response.order.pspReference,
        ...response.order,
        ...response.amount,
        paymentMethod: response.paymentMethod,
      }); // entire response exceeds string length
    });

    const discountAmount = new Money(
      response.amount.value,
      response.amount.currency,
    );
    const remainingAmount = new Money(
      response.order.remainingAmount.value,
      response.order.remainingAmount.currency,
    );

    const divideBy = getDivisorForCurrency(remainingAmount);
    response.remainingAmountFormatted = remainingAmount
      .divide(divideBy)
      .toFormattedString();
    response.discountAmountFormatted = discountAmount
      .divide(divideBy)
      .toFormattedString();

    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error(
      `Failed to create partial payment.. ${error.toString()}`,
    );
    res.json({ error: true });
  }
  return next();
}

module.exports = makePartialPayment;
