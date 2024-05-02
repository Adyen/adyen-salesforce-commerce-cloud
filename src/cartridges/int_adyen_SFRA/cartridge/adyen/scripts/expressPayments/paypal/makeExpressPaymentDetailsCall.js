const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

function setBillingAndShippingAddress(currentBasket) {
  let { billingAddress } = currentBasket;
  let { shippingAddress } = currentBasket.getDefaultShipment();
  Transaction.wrap(() => {
    if (!shippingAddress) {
      shippingAddress = currentBasket
        .getDefaultShipment()
        .createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });

  const shopperDetails = JSON.parse(session.privacy.shopperDetails);

  Transaction.wrap(() => {
    billingAddress.setFirstName(shopperDetails.shopperName.firstName);
    billingAddress.setLastName(shopperDetails.shopperName.lastName);
    billingAddress.setAddress1(shopperDetails.billingAddress.street);
    billingAddress.setCity(shopperDetails.billingAddress.city);
    billingAddress.setPhone(shopperDetails.telephoneNumber);
    billingAddress.setPostalCode(shopperDetails.billingAddress.postalCode);
    billingAddress.setStateCode(shopperDetails.billingAddress.stateOrProvince);
    billingAddress.setCountryCode(shopperDetails.billingAddress.country);

    shippingAddress.setFirstName(shopperDetails.shopperName.firstName);
    shippingAddress.setLastName(shopperDetails.shopperName.lastName);
    shippingAddress.setAddress1(shopperDetails.shippingAddress.street);
    shippingAddress.setCity(shopperDetails.shippingAddress.city);
    shippingAddress.setPhone(shopperDetails.telephoneNumber);
    shippingAddress.setPostalCode(shopperDetails.shippingAddress.postalCode);
    shippingAddress.setStateCode(
      shopperDetails.shippingAddress.stateOrProvince,
    );
    shippingAddress.setCountryCode(shopperDetails.shippingAddress.country);

    currentBasket.setCustomerEmail(shopperDetails.shopperEmail);

    // Setting the session variable to null after assigning the shopper data to basket level
    session.privacy.shopperDetails = null;
  });
}

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment.
   It is currently used only for PayPal Express Flow
 */
function makeExpressPaymentDetailsCall(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const currentBasket = BasketMgr.getCurrentBasket();

    const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(
      request.data,
    );

    setBillingAndShippingAddress(currentBasket);
    const order = OrderMgr.createOrder(currentBasket);
    const fraudDetectionStatus = { status: 'success' };
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      AdyenLogs.error_log('Failed to place the PayPal express order');
    }

    const response = AdyenHelper.createAdyenCheckoutResponse(
      paymentsDetailsResponse,
    );

    response.orderNo = order.orderNo;
    response.orderToken = order.orderToken;
    res.json(response);
    return next();
  } catch (e) {
    AdyenLogs.error_log(
      `Could not verify express /payment/details: ${e.toString()} in ${
        e.fileName
      }:${e.lineNumber}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = makeExpressPaymentDetailsCall;
