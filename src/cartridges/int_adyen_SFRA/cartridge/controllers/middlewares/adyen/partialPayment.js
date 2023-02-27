const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const constants = require('*/cartridge/adyenConstants/constants');

function responseContainsErrors(response) {
  return (
    response?.error || response?.resultCode !== constants.RESULTCODES.AUTHORISED
  );
}

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

    if (responseContainsErrors(response)) {
      const errorMsg = `partial payment request did not go through .. resultCode: ${response?.resultCode}`;
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

    // Update cached session data
    const partialPaymentsOrderData = JSON.parse(
      session.privacy.partialPaymentData,
    );
    partialPaymentsOrderData.remainingAmount = response?.order?.remainingAmount;
    session.privacy.partialPaymentData = JSON.stringify(
      partialPaymentsOrderData,
    );

    const divideBy = AdyenHelper.getDivisorForCurrency(remainingAmount);
    const remainingAmountFormatted = remainingAmount
      .divide(divideBy)
      .toFormattedString();
    response.remainingAmountFormatted = remainingAmountFormatted;

    const discountAmountFormatted = discountAmount
      .divide(divideBy)
      .toFormattedString();
    response.discountAmountFormatted = discountAmountFormatted;

    const addedGiftCards = currentBasket?.custom?.adyenGiftCards
      ? JSON.parse(currentBasket.custom?.adyenGiftCards)
      : [];

    const dataToStore = {
      discountedAmount: discountAmountFormatted,
      expiresAt: response.order.expiresAt,
      giftCard: {
        ...response.paymentMethod,
        amount: response.amount,
        name: giftcardBrand,
        pspReference: response.pspReference,
      },
      orderAmount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(
          currentBasket.getTotalGrossPrice(),
        ).value,
      },
      partialPaymentsOrder: {
        orderData: response.order.orderData,
        pspReference: response.order.pspReference,
      },
      remainingAmount: response.order.remainingAmount,
      remainingAmountFormatted,
    };

    addedGiftCards.push(dataToStore);

    Transaction.wrap(() => {
      currentBasket.custom.adyenGiftCards = JSON.stringify(addedGiftCards);
    });

    const totalDiscountedAmount = new Money(
      addedGiftCards.reduce(
        (accumulator, currentValue) =>
          accumulator + currentValue.giftCard.amount.value,
        0,
      ),
      response.order.remainingAmount.currency,
    );

    res.json({
      ...dataToStore,
      totalDiscountedAmount: totalDiscountedAmount
        .divide(divideBy)
        .toFormattedString(),
      giftCards: addedGiftCards,
      message: Resource.msgf(
        'infoMessage.giftCard',
        'adyen',
        null,
        remainingAmountFormatted,
      ),
    });
  } catch (error) {
    AdyenLogs.error_log(
      `Failed to create partial payment.. ${error.toString()}`,
    );
    res.json({ error: true });
  }
  return next();
}

module.exports = makePartialPayment;
