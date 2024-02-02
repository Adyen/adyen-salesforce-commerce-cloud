const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');
const constants = require('*/cartridge/adyenConstants/constants');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');

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
  const currentBasket = BasketMgr.getCurrentBasket();
  let countryCode = getCountryCode(currentBasket, req.locale);
  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const connectedTerminals = getConnectedTerminals();
  if (
    currentBasket.getShipments().length > 0 &&
    currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode();
  }
  let paymentMethods;
  try {
    paymentMethods = getPaymentMethods.getMethods(
      BasketMgr.getCurrentBasket(),
      countryCode.value?.toString() || countryCode.value,
    ).paymentMethods;
  } catch (err) {
    paymentMethods = [];
  }

  res.json({
    AdyenPaymentMethods: paymentMethods,
    imagePath: adyenURL,
    adyenDescriptions: paymentMethodDescriptions,
    adyenConnectedTerminals: JSON.parse(connectedTerminals),
  });
  return next();
}

module.exports = getCheckoutPaymentMethods;
