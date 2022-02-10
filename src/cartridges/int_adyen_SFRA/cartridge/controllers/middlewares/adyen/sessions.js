const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const { createSession } = require('*/cartridge/scripts/adyenSessions');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const Locale = require('dw/util/Locale');
const PaymentMgr = require('dw/order/PaymentMgr');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const constants = require('*/cartridge/adyenConstants/constants');
const paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');

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

/**
 * Make a request to Adyen to create a new session
 */
function callCreateSession(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = getCountryCode(currentBasket, req.locale);
    const response = createSession(
      currentBasket,
      AdyenHelper.getCustomer(req.currentCustomer),
      countryCode,
    );
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const connectedTerminals = getConnectedTerminals();

    res.json({
      id: response.id,
      sessionData: response.sessionData,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      adyenConnectedTerminals: JSON.parse(connectedTerminals),
    });
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = callCreateSession;
