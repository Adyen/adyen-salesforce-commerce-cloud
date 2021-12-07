const Resource = require('dw/web/Resource');
const BasketMgr = require('dw/order/BasketMgr');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const {
  getConnectedTerminals,
  getCountryCode,
} = require('*/cartridge/controllers/middlewares/adyen/getPaymentMethod/utils');

function handlePaymentMethod({ req, res, next }) {
  const currentBasket = BasketMgr.getCurrentBasket();
  const countryCode = getCountryCode(currentBasket, req.locale);
  const response = getPaymentMethods.getMethods(
    BasketMgr.getCurrentBasket(),
    AdyenHelper.getCustomer(req.currentCustomer),
    countryCode,
  );
  const paymentMethodDescriptions = response.paymentMethods.map((method) => ({
    brandCode: method.type,
    description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
  }));

  const connectedTerminals = getConnectedTerminals();

  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const currency = currentBasket.getTotalGrossPrice().currencyCode;
  const paymentAmount = currentBasket.getTotalGrossPrice().isAvailable()
    ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
    : new dw.value.Money(1000, currency);
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
    amount: { value: paymentAmount.value, currency },
    countryCode,
  };

  res.json(jsonResponse);
  return next();
}

module.exports = handlePaymentMethod;
