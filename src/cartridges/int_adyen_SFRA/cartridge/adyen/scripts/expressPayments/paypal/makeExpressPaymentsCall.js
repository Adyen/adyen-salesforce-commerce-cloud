const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');

function makeExpressPaymentsCall(req, res, next) {
  try {
    const { isExpressPdp } = JSON.parse(req.form.data || '{}');
    const currentBasket = isExpressPdp
      ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
      : BasketMgr.getCurrentBasket();

    const productLines = currentBasket.getAllProductLineItems().toArray();
    const productQuantity = currentBasket.getProductQuantityTotal();
    const hashedProducts = AdyenHelper.getAdyenHash(
      productLines,
      productQuantity,
    );
    let paymentInstrument;
    Transaction.wrap(() => {
      currentBasket.removeAllPaymentInstruments();
      paymentInstrument = currentBasket.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
        currentBasket.getAdjustedMerchandizeTotalNetPrice(),
      );
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
      );
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.adyenPaymentData = JSON.stringify({
        ...JSON.parse(req.form.data || '{}'),
        isExpressPdp,
      });
      currentBasket.custom.adyenProductLineItems = hashedProducts;
    });
    // Creates order number to be utilized for PayPal express
    const paypalExpressOrderNo = OrderMgr.createOrderNo();
    // Create request object with payment details
    const paymentRequest = AdyenHelper.createAdyenRequestObject(
      paypalExpressOrderNo,
      null,
      paymentInstrument,
    );
    // Set payment instrument fields
    AdyenHelper.setPaymentInstrumentFields(paymentInstrument, paymentRequest);
    paymentRequest.amount = {
      currency: paymentInstrument.paymentTransaction.amount.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(
        paymentInstrument.paymentTransaction.amount,
      ).getValueOrNull(),
    };
    paymentRequest.lineItems = paypalHelper.getLineItems(
      {
        Basket: currentBasket,
      },
      true,
    );
    paymentRequest.shopperConversionId = session.sessionID.slice(0, 200);
    let result;
    Transaction.wrap(() => {
      result = adyenCheckout.doPaymentsCall(
        null,
        paymentInstrument,
        paymentRequest,
      );
    });
    session.privacy.paypalExpressOrderNo = paypalExpressOrderNo;
    session.privacy.pspReference = result.pspReference;
    res.json(result);
  } catch (error) {
    AdyenLogs.fatal_log('Paypal express payments request failed', error);
    res.setStatusCode(500);
    setErrorType(error, res, {
      errorMessage: Resource.msg('error.express.paypal.payments', 'cart', null),
    });
  }
  return next();
}

module.exports = makeExpressPaymentsCall;
