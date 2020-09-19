const Resource = require('dw/web/Resource');
const BasketMgr = require('dw/order/BasketMgr');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const {
  getConnectedTerminals,
  getCountryCode,
  getCustomer,
} = require('./utils');

function handlePaymentMethod({ req, res, next }) {
  const currentBasket = BasketMgr.getCurrentBasket();
  const countryCode = getCountryCode(currentBasket, req.locale);
  const response = getPaymentMethods.getMethods(
    BasketMgr.getCurrentBasket(),
    getCustomer(req.currentCustomer),
    countryCode,
  );
  const paymentMethodDescriptions = response.paymentMethods.map((method) => ({
    brandCode: method.type,
    description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
  }));

  const connectedTerminals = getConnectedTerminals();

  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.stringify(connectedTerminals) === "{}" ? '' : JSON.parse(connectedTerminals)
  };

  if (AdyenHelper.getCreditCardInstallments()) {
    const paymentAmount = currentBasket.getTotalGrossPrice()
      ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
      : 1000;
    const currency = currentBasket.getTotalGrossPrice().currencyCode;
    jsonResponse.amount = { value: paymentAmount, currency };
    jsonResponse.countryCode = countryCode;
  }

  res.json(jsonResponse);
  return next();
}

module.exports = handlePaymentMethod;
