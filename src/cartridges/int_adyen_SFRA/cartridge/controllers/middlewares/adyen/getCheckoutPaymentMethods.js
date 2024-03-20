const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');
const constants = require('*/cartridge/adyenConstants/constants');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function getCountryCode(currentBasket, locale) {
  const countryCode = Locale.getLocale(locale.id).country;
  const firstItem = currentBasket?.getShipments()?.[0];
  if (firstItem?.shippingAddress) {
    return firstItem.shippingAddress.getCountryCode().value;
  }
  return countryCode;
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
    const countryCode =
      currentBasket.getShipments().length > 0 &&
      currentBasket.getShipments()[0].shippingAddress
        ? currentBasket.getShipments()[0].shippingAddress.getCountryCode().value
        : getCountryCode(currentBasket, req.locale).value;
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
