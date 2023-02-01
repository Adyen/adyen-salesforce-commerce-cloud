const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');

function getCheckoutPaymentMethods(req, res, next) {
  let countryCode = Locale.getLocale(req.locale.id).country;
  const currentBasket = BasketMgr.getCurrentBasket();
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
  });
  return next();
}

module.exports = getCheckoutPaymentMethods;
