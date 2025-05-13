const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');
/*
 * Makes a payment details call to Adyen to confirm the current status of a payment.
   It is currently used only for PayPal Express Flow
 */
function makeExpressPaymentDetailsCall(req, res, next) {
  try {
    const request = JSON.parse(req.form.data);
    const currentBasket = BasketMgr.getCurrentBasket();
    const productLines = currentBasket.getAllProductLineItems().toArray();
    const productQuantity = currentBasket.getProductQuantityTotal();
    const hashedProducts = AdyenHelper.getAdyenHash(
      productLines,
      productQuantity,
    );
    if (hashedProducts !== currentBasket.custom.adyenProductLineItems) {
      throw new AdyenError(
        'Basket products changed, cannot complete transaction',
      );
    }

    const validationOrderStatus = hooksHelper(
      'app.validate.order',
      'validateOrder',
      currentBasket,
      // eslint-disable-next-line global-require
      require('*/cartridge/scripts/hooks/validateOrder').validateOrder,
    );
    if (validationOrderStatus.error) {
      throw new AdyenError(validationOrderStatus.message);
    }

    // create order
    let order = null;
    Transaction.wrap(() => {
      order = OrderMgr.createOrder(
        currentBasket,
        session.privacy.paypalExpressOrderNo,
      );
    });
    if (!order) {
      throw new AdyenError('Order could not be created for paypal express');
    }

    const response = adyenCheckout.doPaymentsDetailsCall(request.data);

    response.orderNo = order.orderNo;
    response.orderToken = order.orderToken;
    // Storing the paypal express response to make use of show confirmation logic
    Transaction.wrap(() => {
      order.custom.Adyen_paypalExpressResponse = JSON.stringify(response);
    });
    res.json({ orderNo: response.orderNo, orderToken: response.orderToken });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not verify express /payment/details:', error);
    setErrorType(error, res, {
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', 'general').toString(),
    });
    return next();
  }
}

module.exports = makeExpressPaymentDetailsCall;
