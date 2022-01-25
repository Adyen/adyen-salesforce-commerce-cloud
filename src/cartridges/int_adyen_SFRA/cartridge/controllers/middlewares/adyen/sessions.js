const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const { createSession } = require('*/cartridge/scripts/adyenSessions');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const {
  getConnectedTerminals,
  getCountryCode,
} = require('*/cartridge/controllers/middlewares/adyen/getPaymentMethod/utils');

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
      adyenConnectedTerminals: JSON.parse(connectedTerminals),
    });
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = callCreateSession;
