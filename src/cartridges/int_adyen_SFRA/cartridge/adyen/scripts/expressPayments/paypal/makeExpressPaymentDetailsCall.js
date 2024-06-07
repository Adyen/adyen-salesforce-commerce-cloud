const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');

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

function setPaymentInstrumentFields(paymentInstrument, response) {
  paymentInstrument.custom.adyenPaymentMethod =
    AdyenHelper.getAdyenComponentType(response.paymentMethod.type);
  paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] =
    AdyenHelper.getAdyenComponentType(response.paymentMethod.type);
  paymentInstrument.custom.Adyen_Payment_Method_Variant =
    response.paymentMethod.type.toLowerCase();
  paymentInstrument.custom[
    `${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`
  ] = response.paymentMethod.type.toLowerCase();
}

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment.
   It is currently used only for PayPal Express Flow
 */
function makeExpressPaymentDetailsCall(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const currentBasket = BasketMgr.getCurrentBasket();

    const response = adyenCheckout.doPaymentsDetailsCall(request.data);

    setBillingAndShippingAddress(currentBasket);
    const order = OrderMgr.createOrder(
      currentBasket,
      session.privacy.paypalExpressOrderNo,
    );
    const fraudDetectionStatus = { status: 'success' };
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      throw new Error('Failed to place the PayPal express order');
    }

    response.orderNo = order.orderNo;
    response.orderToken = order.orderToken;
    const paymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    )[0];
    // Storing the paypal express response to make use of show confirmation logic
    Transaction.wrap(() => {
      order.custom.Adyen_paypalExpressResponse = JSON.stringify(response);
      setPaymentInstrumentFields(paymentInstrument, response);
    });
    res.json({ orderNo: response.orderNo, orderToken: response.orderToken });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not verify express /payment/details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = makeExpressPaymentDetailsCall;
