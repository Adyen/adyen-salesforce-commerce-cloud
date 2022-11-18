const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');

function makePartialPayment(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const currentBasket = BasketMgr.getCurrentBasket();

    const {
      paymentMethod,
      partialPaymentsOrder,
      amount,
      giftcardBrand,
    } = request;
    const partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount,
      reference: currentBasket.getUUID(),
      paymentMethod,
      order: partialPaymentsOrder,
    };

    const response = adyenCheckout.doPaymentsCall(
      null,
      null,
      partialPaymentRequest,
    ); // no order created yet and no PI needed (for giftcards it will be created on Order level)

    if (
      response.error ||
      response.resultCode !== constants.RESULTCODES.AUTHORISED
    ) {
      let errorMsg = 'partial payment request did not go through';
      errorMsg += response.resultCode
        ? `.. resultCode: ${response.resultCode}`
        : '';
      throw new Error(errorMsg);
    }

    Transaction.wrap(() => {
      session.privacy.giftCardResponse = JSON.stringify({
        giftCardpspReference: response.pspReference,
        orderPSPReference: response.order.pspReference,
        ...response.order,
        ...response.amount,
        paymentMethod: response.paymentMethod,
        brand: giftcardBrand,
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

    const divideBy = AdyenHelper.getDivisorForCurrency(remainingAmount);
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
