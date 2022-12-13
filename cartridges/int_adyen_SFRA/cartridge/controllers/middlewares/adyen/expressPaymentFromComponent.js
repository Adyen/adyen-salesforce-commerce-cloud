"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var _require = require('./paymentFromComponent/utils'),
  getProcessedPaymentInstrument = _require.getProcessedPaymentInstrument,
  handlePayment = _require.handlePayment;
var _require2 = require('./expressPaymentFromComponent/utils'),
  setAddressDetails = _require2.setAddressDetails;

/**
 * Make a payment from inside an express component, skipping the summary page. (paypal, amazon)
 */
function expressPaymentFromComponent(req, res, next) {
  //  if (!req.currentCustomer?.addressBook?.preferredAddress) {
  //    Logger.getLogger('Adyen').error(
  //      'error in expressPayment: No default address found.',
  //    );
  //    res.json({ error: true });
  //    return next();
  //  }

  var reqDataObj = JSON.parse(req.form.data);
  // Cancel order
  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error("Shopper cancelled paymentFromComponent transaction for order ".concat(reqDataObj.merchantReference));
    var _order = OrderMgr.getOrder(reqDataObj.merchantReference);
    Transaction.wrap(function () {
      OrderMgr.failOrder(_order, true);
    });
    res.json({});
    return next();
  }
  var currentBasket = BasketMgr.getCurrentBasket();
  var paymentInstrument = getProcessedPaymentInstrument(currentBasket, req.form);

  //  const address = req.currentCustomer.addressBook?.preferredAddress;

  //  Transaction.wrap(() => {
  //    // Set customer email on basket
  //    currentBasket.setCustomerEmail(currentBasket.getCustomer().profile?.email);
  //
  //    // Set default address on basket billing address
  //    const billingAddress = currentBasket.createBillingAddress();
  //    setAddressDetails(billingAddress, address);
  //
  //    // Set default address on basket shipping address
  //    const shipment = currentBasket.getShipment('me');
  //    const shippingAddress = shipment.createShippingAddress();
  //    setAddressDetails(shippingAddress, address);
  //  });

  var order = COHelpers.createOrder(currentBasket);
  Logger.getLogger('Adyen').error('order ' + order);
  handlePayment(res, order, paymentInstrument);
  return next();
}
module.exports = expressPaymentFromComponent;