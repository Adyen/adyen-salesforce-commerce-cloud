const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const constants = require('*/cartridge/adyen/config/constants');

function doPartialPaymentsCall(paymentRequest) {
  try {
    return AdyenHelper.executeCall(constants.SERVICE.PAYMENT, paymentRequest);
  } catch (error) {
    AdyenLogs.fatal_log('Partial payments call failed:', error);
    return {
      error: true,
      args: {
        adyenErrorMessage: Resource.msg(
          'confirm.error.declined',
          'checkout',
          null,
        ),
      },
    };
  }
}

function responseContainsErrors(response) {
  return (
    response?.error || response?.resultCode !== constants.RESULTCODES.AUTHORISED
  );
}

function makePartialPayment(req, res, next) {
  try {
    const request = JSON.parse(req.form.data);
    const currentBasket = BasketMgr.getCurrentBasket();

    const { encryptedCardNumber, encryptedSecurityCode, brand, giftcardBrand } =
      request;
    const paymentMethod = {
      encryptedCardNumber,
      encryptedSecurityCode,
      brand,
      type: 'giftcard',
    };
    const { order } = JSON.parse(session.privacy.partialPaymentData);
    const partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: JSON.parse(session.privacy.giftCardBalance),
      reference: currentBasket.custom.adyenGiftCardsOrderNo,
      paymentMethod,
      order,
      shopperInteraction: constants.SHOPPER_INTERACTIONS.ECOMMERCE,
      shopperConversionId: session.sessionID.slice(0, 200),
    };

    const response = doPartialPaymentsCall(partialPaymentRequest);

    if (responseContainsErrors(response)) {
      const errorMsg = `partial payment request did not go through .. resultCode: ${response?.resultCode}`;
      throw new Error(errorMsg);
    }

    Transaction.wrap(() => {
      session.privacy.giftCardResponse = JSON.stringify({
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
    partialPaymentsOrderData.order = {
      orderData: response?.order?.orderData,
      pspReference: response?.order?.pspReference,
    };
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
      orderCreated: !!response?.order?.orderData,
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
    AdyenLogs.error_log('Failed to create partial payment:', error);
    res.json({ error: true });
  }
  return next();
}

module.exports = makePartialPayment;
