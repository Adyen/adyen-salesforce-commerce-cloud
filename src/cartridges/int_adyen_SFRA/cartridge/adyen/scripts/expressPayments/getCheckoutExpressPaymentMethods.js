const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const translations = require('*/cartridge/config/adyenTranslations');
const paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');

const getAmount = (currency, currentBasket) =>
  currentBasket?.getTotalGrossPrice().isAvailable()
    ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
    : new dw.value.Money(1000, currency);

const getExpressPaymentMethods = (expressPaymentMethods) => {
  const paymentMethodOrder = AdyenConfigs.getExpressPaymentsOrder() || '';

  return Object.keys(expressPaymentMethods)
    .filter((item) => expressPaymentMethods[item])
    .sort(
      (a, b) => paymentMethodOrder.indexOf(a) - paymentMethodOrder.indexOf(b),
    );
};

function getCheckoutExpressPaymentMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = Locale.getLocale(req.locale.id).country;
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const currency = currentBasket
      ? currentBasket.getTotalGrossPrice().currencyCode
      : session.currency.currencyCode;
    const paymentAmount = getAmount(currency, currentBasket);
    const shopperEmail = AdyenHelper.getCustomerEmail();

    const cachedExpressPaymentMethods = req.session.privacyCache.get(
      `expressPaymentMethods_${countryCode}`,
    );
    const paymentMethods = cachedExpressPaymentMethods
      ? JSON.parse(cachedExpressPaymentMethods)
      : getPaymentMethods.getMethods(
          paymentAmount,
          AdyenHelper.getCustomer(req.currentCustomer),
          countryCode,
          shopperEmail,
          [
            constants.PAYMENTMETHODS.APPLEPAY,
            constants.PAYMENTMETHODS.AMAZONPAY,
            constants.PAYMENTMETHODS.GOOGLEPAY,
            constants.PAYMENTMETHODS.PAYPAL,
          ],
        );
    req.session.privacyCache.set(
      `expressPaymentMethods_${countryCode}`,
      JSON.stringify(paymentMethods),
    );

    const expressPaymentMethodsPdp = {
      [constants.PAYMENTMETHODS.APPLEPAY]:
        !!AdyenConfigs.isApplePayExpressOnPdpEnabled(),
      [constants.PAYMENTMETHODS.GOOGLEPAY]:
        !!AdyenConfigs.isGooglePayExpressOnPdpEnabled(),
    };

    const expressPaymentMethodsCart = {
      [constants.PAYMENTMETHODS.APPLEPAY]:
        !!AdyenConfigs.isApplePayExpressEnabled(),
      [constants.PAYMENTMETHODS.AMAZONPAY]:
        !!AdyenConfigs.isAmazonPayExpressEnabled(),
      [constants.PAYMENTMETHODS.GOOGLEPAY]:
        !!AdyenConfigs.isGooglePayExpressEnabled(),
      [constants.PAYMENTMETHODS.PAYPAL]:
        !!AdyenConfigs.isPayPalExpressEnabled(),
    };

    res.json({
      AdyenPaymentMethods: paymentMethods,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      adyenTranslations: translations,
      amount: { value: paymentAmount.value, currency },
      countryCode,
      applicationInfo: AdyenHelper.getApplicationInfo(),
      cartExpressMethods: getExpressPaymentMethods(expressPaymentMethodsCart),
      pdpExpressMethods: getExpressPaymentMethods(expressPaymentMethodsPdp),
    });
  } catch (error) {
    AdyenLogs.fatal_log('Failed to fetch express payment methods', error);
    setErrorType(error, res);
  }
  return next();
}

module.exports = getCheckoutExpressPaymentMethods;
