const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const { setAddressDetails } = require('./expressPaymentFromComponent/utils');

/**
 * Make a payment from inside an express component, skipping the summary page. (paypal, amazon)
 */
function expressPaymentFromComponent(req, res, next) {
  if(!req.currentCustomer.addressBook?.preferredAddress) {
    Logger.getLogger('Adyen').error('error in expressPayment: No default address found.');
    res.json({error: true});
    return next();
  }

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
  let paymentInstrument;
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
        currentBasket.totalGrossPrice,
    );
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
    );
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;

    const address = req.currentCustomer.addressBook?.preferredAddress;

    // Set default address on basket billing address
    const billingAddress = currentBasket.createBillingAddress();
    setAddressDetails(billingAddress, address);

    //set default address on basket shipping address
    const shipment = currentBasket.getShipment('me');
    const shippingAddress = shipment.createShippingAddress();
    setAddressDetails(shippingAddress, address);
  });

  const order = COHelpers.createOrder(currentBasket);

  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
  });

  result.orderNo = order.orderNo;
  res.json(result);
  return next();
}

module.exports = expressPaymentFromComponent;
