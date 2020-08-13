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
  function getCustomer() {
    if (req.currentCustomer.profile) {
      return CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo,
      );
    }
    return null;
  }

  const currentBasket = BasketMgr.getCurrentBasket();

  function getCountryCode() {
    const countryCode = Locale.getLocale(req.locale.id).country;
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

  function handlePaymentMethod() {
    const countryCode = getCountryCode();
    const response = getPaymentMethods.getMethods(
      BasketMgr.getCurrentBasket(),
      getCustomer(),
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

  try {
    return handlePaymentMethod();
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `Error retrieving Payment Methods. Error message: ${
        err.message
      } more details: ${err.toString()} in ${err.fileName}:${err.lineNumber}`,
    );
    // response = [];
    return next();
  }
}

module.exports = getPMs;
