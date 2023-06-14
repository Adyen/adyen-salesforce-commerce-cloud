const BasketMgr = require('dw/order/BasketMgr');
const Money = require('dw/value/Money');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function getFormattedProperties(checkBalanceResponse, orderAmount) {
  if (checkBalanceResponse.resultCode === 'Success') {
    const remainingAmount = new Money(0, checkBalanceResponse.balance.currency);
    const remainingDivideBy =
      AdyenHelper.getDivisorForCurrency(remainingAmount);
    const remainingAmountFormatted = remainingAmount
      .divide(remainingDivideBy)
      .toFormattedString();
    const totalAmount = new Money(orderAmount.value, orderAmount.currency);
    const totalDivideBy = AdyenHelper.getDivisorForCurrency(totalAmount);
    const totalAmountFormatted = totalAmount
      .divide(totalDivideBy)
      .toFormattedString();
    return {
      remainingAmountFormatted,
      totalAmountFormatted,
    };
  }
  return {};
}

function getAddedGiftCards(basket) {
  return basket.custom?.adyenGiftCards
    ? JSON.parse(basket.custom.adyenGiftCards)
    : null;
}

function callCheckBalance(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const orderNo =
      currentBasket.custom?.adyenGiftCardsOrderNo || OrderMgr.createOrderNo();
    const giftCardsAdded = getAddedGiftCards(currentBasket);

    const orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(
        currentBasket.getTotalGrossPrice(),
      ).value,
    };
    const amount = giftCardsAdded
      ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount
      : orderAmount;

    const request = JSON.parse(req.body);
    const paymentMethod = request.paymentMethod
      ? request.paymentMethod
      : constants.ACTIONTYPES.GIFTCARD;

    const checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount,
      reference: orderNo,
      paymentMethod,
    };

    const checkBalanceResponse =
      adyenCheckout.doCheckBalanceCall(checkBalanceRequest);

    Transaction.wrap(() => {
      currentBasket.custom.adyenGiftCardsOrderNo = orderNo;
    });

    res.json({
      ...checkBalanceResponse,
      ...getFormattedProperties(checkBalanceResponse, orderAmount),
    });
  } catch (error) {
    AdyenLogs.error_log(
      `Failed to check gift card balance ${error.toString()}`,
    );
    res.json({ error: true });
  }
  return next();
}

module.exports = callCheckBalance;
