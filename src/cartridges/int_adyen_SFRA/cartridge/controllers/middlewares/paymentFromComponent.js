import * as OrderMgr from 'dw/order/OrderMgr';
import * as BasketMgr from 'dw/order/BasketMgr';
import * as PaymentMgr from 'dw/order/PaymentMgr';
import * as Logger from 'dw/system/Logger';
import * as Transaction from 'dw/system/Transaction';
import * as adyenCheckout from '*/cartridge/scripts/adyenCheckout';
import * as COHelpers from '*/cartridge/scripts/checkout/checkoutHelpers';
import * as constants from '*/cartridge/adyenConstants/constants';
import * as collections from '*/cartridge/scripts/util/collections';

function paymentFromComponent(req, res, next) {
  let order;
  const reqDataObj = JSON.parse(req.form.data);

  if (reqDataObj.cancelTransaction) {
    order = OrderMgr.getOrder(session.privacy.orderNo);
    Logger.getLogger('Adyen').error(
      `Shopper cancelled transaction for order ${session.privacy.orderNo}`,
    );
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.json({ result: 'cancelled' });
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
    paymentInstrument.custom.adyenPaymentMethod = reqDataObj.paymentMethod.type;
  });
  order = COHelpers.createOrder(currentBasket);
  session.privacy.orderNo = order.orderNo;

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  if (result.resultCode !== 'Pending') {
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
  }
  res.json(result);
  return next();
}

export default paymentFromComponent;
