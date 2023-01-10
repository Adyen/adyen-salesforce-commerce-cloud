const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');

/**
 * Make a request to Adyen to get customer payment data
 */
function callGetCustomerPaymentData(req, res, next) {
  const currentBasket = BasketMgr.getCurrentBasket();
  const countryCode = Locale.getLocale(req.querystring.locale).country;
  const paymentMethodsData = getPaymentMethods.getMethods(
    currentBasket,
    req.currentCustomer.raw,
    countryCode,
  );
  res.json({
    amount: {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(
        currentBasket.getTotalGrossPrice(),
      ).value,
    },
    countryCode,
    paymentMethods: paymentMethodsData.paymentMethods,
  });
  return next();
}

module.exports = callGetCustomerPaymentData;
