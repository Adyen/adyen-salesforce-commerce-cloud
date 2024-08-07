const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
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

function getExpressPdpPaymentMethods(req, res, next) {
  try {
    const temporaryBasket = BasketMgr.createTemporaryBasket();
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const countryCode = getCountryCode(temporaryBasket, req.locale);

    const paymentMethods = getPaymentMethods.getMethods(
      temporaryBasket,
      AdyenHelper.getCustomer(req.currentCustomer),
      countryCode,
    );
    res.json({
      AdyenPaymentMethods: paymentMethods,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
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

module.exports = getExpressPdpPaymentMethods;
