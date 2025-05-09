const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const { PAYMENTMETHODS } = require('*/cartridge/adyen/config/constants');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
const Collections = require('*/cartridge/scripts/util/collections');
const shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

function updateShippingAddress(currentBasket, address) {
  if (address) {
    let { shippingAddress } = currentBasket.getDefaultShipment();
    Transaction.wrap(() => {
      if (!shippingAddress) {
        shippingAddress = currentBasket
          .getDefaultShipment()
          .createShippingAddress();
      }
      shippingAddress.setCity(address?.city);
      shippingAddress.setPostalCode(address?.postalCode);
      shippingAddress.setStateCode(address?.stateCode);
      shippingAddress.setCountryCode(address?.countryCode);
    });
  }
}

function getBasket(isExpressPdp) {
  return isExpressPdp
    ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
    : BasketMgr.getCurrentBasket();
}
/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    const { address, currentPaymentData, paymentMethodType, isExpressPdp } =
      JSON.parse(req.form.data);
    const currentBasket = getBasket(isExpressPdp);
    if (!currentBasket) {
      res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show').toString(),
      });

      return next();
    }
    updateShippingAddress(currentBasket, address);
    let currentShippingMethodsModels = [];
    const shipments = currentBasket.getShipments();
    Collections.forEach(shipments, (shipment) => {
      if (currentShippingMethodsModels.length > 0) return;

      const methods = AdyenHelper.getApplicableShippingMethods(
        shipment,
        address,
      );
      Transaction.wrap(() => {
        shippingHelper.selectShippingMethod(shipment);
        basketCalculationHelpers.calculateTotals(currentBasket);
      });
      if (methods && methods.length > 0) {
        currentShippingMethodsModels = methods;
      }
    });

    if (!currentShippingMethodsModels?.length) {
      throw new Error('No applicable shipping methods found');
    }
    let response = {};
    if (paymentMethodType === PAYMENTMETHODS.PAYPAL) {
      const paypalUpdateOrderResponse = adyenCheckout.doPaypalUpdateOrderCall(
        paypalHelper.createPaypalUpdateOrderRequest(
          session.privacy.pspReference,
          currentBasket,
          currentShippingMethodsModels,
          currentPaymentData,
        ),
      );
      AdyenLogs.info_log(
        `Paypal Order Update Call: ${paypalUpdateOrderResponse.status}`,
      );
      response = { ...response, ...paypalUpdateOrderResponse };
    }
    response.shippingMethods = currentShippingMethodsModels;
    res.json(response);
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch shipping methods', error);
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg(
        'error.cannot.find.shipping.methods',
        'cart',
        null,
      ),
    });
    return next();
  }
}

module.exports = callGetShippingMethods;
