const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function getCountryCode(currentBasket, locale) {
  let countryCode;
  if (currentBasket) {
    const { shippingAddress } = currentBasket.getDefaultShipment();
    if (shippingAddress) {
      countryCode = shippingAddress.getCountryCode().value;
    }
  }
  return countryCode || Locale.getLocale(locale.id).country;
}

const getRemainingAmount = (giftCardResponse, currency, currentBasket) => {
  if (giftCardResponse && JSON.parse(giftCardResponse).remainingAmount) {
    const { value = 1000 } = JSON.parse(giftCardResponse).remainingAmount;
    return new dw.value.Money(value, currency);
  }
  return currentBasket?.getTotalGrossPrice().isAvailable()
    ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
    : new dw.value.Money(1000, currency);
};

function getCheckoutPaymentMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = getCountryCode(currentBasket, req.locale);
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const currency = currentBasket
      ? currentBasket.getTotalGrossPrice().currencyCode
      : session.currency.currencyCode;
    const paymentAmount = getRemainingAmount(
      session.privacy.giftCardResponse,
      currency,
      currentBasket,
    );
    const shopperEmail = AdyenHelper.getCustomerEmail();

    const paymentMethods = getPaymentMethods.getMethods(
      paymentAmount,
      AdyenHelper.getCustomer(req.currentCustomer),
      countryCode,
      shopperEmail,
    );
    res.json({
      AdyenPaymentMethods: paymentMethods,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      amount: { value: paymentAmount.value, currency },
      countryCode,
      applicationInfo: AdyenHelper.getApplicationInfo(),
    });
  } catch (error) {
    AdyenLogs.fatal_log('Failed to fetch payment methods', error);
    res.json({ error: true });
  }
  return next();
}

module.exports = getCheckoutPaymentMethods;
