const Locale = require('dw/util/Locale');
const PaymentMgr = require('dw/order/PaymentMgr');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const constants = require('*/cartridge/adyenConstants/constants');

function getCountryCode(currentBasket, locale) {
  const countryCode = Locale.getLocale(locale.id).country;
  const firstItem = currentBasket.getShipments()?.[0];
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

module.exports = {
  getCountryCode,
  getConnectedTerminals,
};
