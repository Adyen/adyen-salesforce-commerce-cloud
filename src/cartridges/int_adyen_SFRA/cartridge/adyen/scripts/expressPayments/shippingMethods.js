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
/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    const { address, currentPaymentData, paymentMethodType } = JSON.parse(
      req.body,
    );
    const currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show').toString(),
      });

      return next();
    }
    const shipment = currentBasket.getDefaultShipment();
    Transaction.wrap(() => {
      let { shippingAddress } = shipment;
      if (!shippingAddress) {
        shippingAddress = currentBasket
          .getDefaultShipment()
          .createShippingAddress();
      }
      shippingAddress.setCity(address.city);
      shippingAddress.setPostalCode(address.postalCode);
      shippingAddress.setStateCode(address.stateCode);
      shippingAddress.setCountryCode(address.countryCode);
    });
    // shippingHelper.ensureShipmentHasMethod(shipment);
    basketCalculationHelpers.calculateTotals(currentBasket);
    const currentShippingMethodsModels =
      AdyenHelper.getApplicableShippingMethods(
        currentBasket.getDefaultShipment(),
        address,
      );
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
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
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
