const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const Resource = require('dw/web/Resource');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const translations = require('*/cartridge/config/adyenTranslations');
const paymentMethodTitles = require('*/cartridge/config/adyenPaymentMethodTitles');
const paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');

const getCountryCode = (currentBasket, locale) => {
  let countryCode;
  if (currentBasket) {
    const { shippingAddress } = currentBasket.getDefaultShipment();
    if (shippingAddress) {
      countryCode = shippingAddress.getCountryCode().value;
    }
  }
  return countryCode || Locale.getLocale(locale.id).country;
};

const getRemainingAmount = (currency, currentBasket) => {
  const partialPaymentOrderData =
    currentBasket?.custom?.partialPaymentOrderData;
  const remainingAmount = partialPaymentOrderData
    ? JSON.parse(partialPaymentOrderData).remainingAmount
    : null;
  if (remainingAmount) {
    const { value = 1000 } = remainingAmount;
    return new dw.value.Money(value, currency);
  }
  return currentBasket?.getTotalGrossPrice().isAvailable()
    ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
    : new dw.value.Money(1000, currency);
};

const supportedStoredPaymentMethods = (storedPaymentMethods) =>
  AdyenConfigs.getAdyenRecurringPaymentsEnabled() && storedPaymentMethods
    ? storedPaymentMethods.filter(
        (pm) =>
          pm.type === constants.SCHEME &&
          pm.supportedShopperInteractions.includes(
            constants.SHOPPER_INTERACTIONS.ECOMMERCE,
          ),
      )
    : [];

const getDisclaimerFor = (key) => {
  const message = Resource.msg(`disclaimer.message.${key}`, 'bnpl', '');
  if (!message) {
    return null;
  }
  const linkText = Resource.msg(`disclaimer.linkText.${key}`, 'bnpl', '');
  const link = Resource.msg(`disclaimer.link.${key}`, 'bnpl', '');
  return { message, ...(linkText && link ? { linkText, link } : {}) };
};

// Resolves each BNPL txVariant to the most specific configured entry:
// exact txVariant -> method family -> generic 'bnpl'. Whole entries are
// resolved (not individual fields) so a specific message never gets a
// generic link.
const getBnplDisclaimers = (countryCode, paymentMethods) => {
  if (!constants.DISCLAIMER_COUNTRIES.includes(countryCode)) {
    return null;
  }
  const disclaimers = {};
  paymentMethods.forEach(({ type }) => {
    const family = constants.BNPL_PAYMENT_METHODS.find(
      (method) => type.indexOf(method) > -1,
    );
    if (!family) {
      return;
    }
    const disclaimer =
      getDisclaimerFor(type) ||
      getDisclaimerFor(family) ||
      getDisclaimerFor('bnpl');
    if (disclaimer) {
      disclaimers[type] = disclaimer;
    }
  });
  return Object.keys(disclaimers).length ? disclaimers : null;
};

function getCheckoutPaymentMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = getCountryCode(currentBasket, req.locale);
    const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
    const currency = currentBasket
      ? currentBasket.getTotalGrossPrice().currencyCode
      : session.currency.currencyCode;
    const paymentAmount = getRemainingAmount(currency, currentBasket);
    const shopperEmail = AdyenHelper.getCustomerEmail();

    const paymentMethods = getPaymentMethods.getMethods(
      paymentAmount,
      AdyenHelper.getCustomer(req.currentCustomer),
      countryCode,
      shopperEmail,
    );

    const showFastlane =
      paymentMethods.paymentMethods.some(
        (pm) => pm.type === constants.PAYMENTMETHODS.FASTLANE,
      ) && !req.currentCustomer.raw.authenticated;

    const sortedPaymentMethods = paymentMethods.paymentMethods.sort((a, b) => {
      if (a.type === constants.PAYMENTMETHODS.FASTLANE) return -1;
      if (b.type === constants.PAYMENTMETHODS.FASTLANE) return 1;
      return 0;
    });

    const disclaimerMessages = getBnplDisclaimers(
      countryCode,
      sortedPaymentMethods,
    );

    res.json({
      AdyenPaymentMethods: {
        paymentMethods: sortedPaymentMethods,
        storedPaymentMethods: supportedStoredPaymentMethods(
          paymentMethods.storedPaymentMethods,
        ),
      },
      shopperEmail,
      showFastlane,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      adyenTranslations: translations,
      adyenPaymentMethodTitles: paymentMethodTitles,
      amount: { value: paymentAmount.value, currency },
      countryCode,
      applicationInfo: AdyenHelper.getApplicationInfo(),
      ...(disclaimerMessages ? { disclaimerMessages } : {}),
    });
  } catch (error) {
    AdyenLogs.fatal_log('Failed to fetch payment methods', error);
    setErrorType(error, res);
  }
  return next();
}

module.exports = getCheckoutPaymentMethods;
