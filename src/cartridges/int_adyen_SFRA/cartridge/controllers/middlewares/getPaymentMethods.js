const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const PaymentMgr = require('dw/order/PaymentMgr');
const Locale = require('dw/util/Locale');
const Logger = require('dw/system/Logger');
const CustomerMgr = require('dw/customer/CustomerMgr');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function getPMs(req, res, next) {
  let countryCode = Locale.getLocale(req.locale.id).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0 &&
    currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode().value;
  }
  let response;
  let paymentMethodDescriptions = [];
  let customer;
  try {
    if (req.currentCustomer.profile) {
      customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo,
      );
    }
    response = getPaymentMethods.getMethods(
      BasketMgr.getCurrentBasket(),
      customer || null,
      countryCode,
    );
    paymentMethodDescriptions = response.paymentMethods.map((method) => ({
      brandCode: method.type,
      description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
    }));
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `Error retrieving Payment Methods. Error message: ${
        err.message
      } more details: ${err.toString()} in ${err.fileName}:${err.lineNumber}`,
    );
    response = [];
    return next();
  }

  let connectedTerminals = '{}';
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    connectedTerminals = adyenTerminalApi.getTerminals().response;
  }

  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
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

module.exports = getPMs;
