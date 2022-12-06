const BasketMgr = require('dw/order/BasketMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const {
  getProcessedPaymentInstrument,
  handlePayment,
} = require('./paymentFromComponent/utils');
const { setAddressDetails } = require('./expressPaymentFromComponent/utils');

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

  const reqDataObj = JSON.parse(req.form.data);
  // Cancel order
  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error(
      `Shopper cancelled paymentFromComponent transaction for order ${reqDataObj.merchantReference}`,
    );

    const order = OrderMgr.getOrder(reqDataObj.merchantReference);
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.json({});
    return next();
  }

  const currentBasket = BasketMgr.getCurrentBasket();

  const paymentInstrument = getProcessedPaymentInstrument(
    currentBasket,
    req.form,
  );

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

  const order = COHelpers.createOrder(currentBasket);
  Logger.getLogger('Adyen').error('order ' + order);

  handlePayment(res, order, paymentInstrument);
  return next();
}

module.exports = expressPaymentFromComponent;
