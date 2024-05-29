const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenTerminalApi = require('*/cartridge/adyen/scripts/payments/adyenTerminalApi');
const paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
const constants = require('*/cartridge/adyen/config/constants');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function getCountryCode(currentBasket, locale) {
  let countryCode;
  const { shippingAddress } = currentBasket.getDefaultShipment();
  if (shippingAddress) {
    countryCode = shippingAddress.getCountryCode().value;
  }
  return countryCode || Locale.getLocale(locale.id).country;
}

function getConnectedTerminals() {
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    return adyenTerminalApi.getTerminals().response;
  }
  return '{}';
}

function getCheckoutPaymentMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = getCountryCode(currentBasket, req.locale).value;
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const connectedTerminals = JSON.parse(getConnectedTerminals());
    const currency = currentBasket.getTotalGrossPrice().currencyCode;
    const getRemainingAmount = (giftCardResponse) => {
      if (giftCardResponse && JSON.parse(giftCardResponse).remainingAmount) {
        return JSON.parse(giftCardResponse).remainingAmount;
      }
      return {
        currency,
        value: AdyenHelper.getCurrencyValueForApi(
          currentBasket.getTotalGrossPrice(),
        ).value,
      };
    };
    const paymentAmount = getRemainingAmount(session.privacy.giftCardResponse);
    const paymentMethods = getPaymentMethods.getMethods(
      currentBasket,
      AdyenHelper.getCustomer(req.currentCustomer),
      countryCode,
    );
    res.json({
      AdyenPaymentMethods: paymentMethods,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      adyenConnectedTerminals: connectedTerminals,
      amount: { value: paymentAmount.value, currency },
      countryCode,
      applicationInfo: AdyenHelper.getApplicationInfo(),
    });
  } catch (err) {
    AdyenLogs.fatal_log(
      `Failed to fetch payment methods ${JSON.stringify(err)}`,
    );
    res.json({ error: true });
  }
  return next();
}

module.exports = getCheckoutPaymentMethods;
