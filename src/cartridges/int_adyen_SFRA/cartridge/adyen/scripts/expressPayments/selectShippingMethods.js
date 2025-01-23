const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const CartModel = require('*/cartridge/models/cart');
const shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const { PAYMENTMETHODS } = require('*/cartridge/adyen/config/constants');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

/**
 * Make a request to Adyen to select shipping methods
 */
// eslint-disable-next-line complexity
function callSelectShippingMethod(req, res, next) {
  const {
    isExpressPdp,
    shipmentUUID,
    methodID,
    currentPaymentData,
    paymentMethodType,
  } = JSON.parse(req.form.data);
  const currentBasket = isExpressPdp
    ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
    : BasketMgr.getCurrentBasket();

  if (!currentBasket) {
    res.json({
      error: true,
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });

    return next();
  }
  try {
    let shipment;
    if (shipmentUUID) {
      shipment = shippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
      shipment = currentBasket.defaultShipment;
    }

    Transaction.wrap(() => {
      shippingHelper.selectShippingMethod(shipment, methodID);

      if (currentBasket && !shipment.shippingMethod) {
        throw new Error(
          `cannot set shippingMethod: ${methodID} for shipment:${shipment?.UUID}`,
        );
      }

      basketCalculationHelpers.calculateTotals(currentBasket);
    });
    let response = {};
    if (paymentMethodType === PAYMENTMETHODS.PAYPAL) {
      const currentShippingMethodsModels =
        AdyenHelper.getApplicableShippingMethods(shipment);
      if (!currentShippingMethodsModels?.length) {
        throw new Error('No applicable shipping methods found');
      }
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
    const basketModel = new CartModel(currentBasket);
    const grandTotalAmount = {
      value: currentBasket.getTotalGrossPrice().value,
      currency: currentBasket.getTotalGrossPrice().currencyCode,
    };
    response = { ...response, ...basketModel, grandTotalAmount };
    res.json(response);
  } catch (error) {
    AdyenLogs.error_log('Failed to set shipping method', error);
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg(
        'error.cannot.select.shipping.method',
        'cart',
        null,
      ),
    });
  }
  return next();
}

module.exports = callSelectShippingMethod;
