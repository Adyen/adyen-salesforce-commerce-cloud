import * as Logger from 'dw/system/Logger';
import * as URLUtils from 'dw/web/URLUtils';
import * as OrderMgr from 'dw/order/OrderMgr';
import * as Transaction from 'dw/system/Transaction';
import * as Resource from 'dw/web/Resource';
import * as Locale from 'dw/util/Locale';
import * as adyenCheckout from '*/cartridge/scripts/adyenCheckout';
import * as constants from '*/cartridge/adyenConstants/constants';
import * as COHelpers from '*/cartridge/scripts/checkout/checkoutHelpers';
import * as AdyenHelper from '*/cartridge/scripts/util/adyenHelper';
import { clearForms } from '../utils';
import { OrderModel } from '*/cartridge/models/order';

export default function showConfirmation(req, res, next) {
  try {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    let adyenPaymentInstrument;
    let paymentData;
    let details;

    // looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }

    // details is either redirectResult or payload
    if (req.querystring.redirectResult) {
      details = { redirectResult: req.querystring.redirectResult };
    } else if (req.querystring.payload) {
      details = { payload: req.querystring.payload };
    }

    // redirect to payment/details
    const requestObject = {
      details,
      paymentData,
    };

    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    Transaction.wrap(() => {
      adyenPaymentInstrument.custom.adyenPaymentData = null;
    });

    // Authorised: The payment authorisation was successfully completed.
    if (
      result.resultCode === 'Authorised' ||
      result.resultCode === 'Pending' ||
      result.resultCode === 'Received'
    ) {
      if (
        result.resultCode === 'Received' &&
        result.paymentMethod.indexOf('alipay_hk') > -1
      ) {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
        });
        Logger.getLogger('Adyen').error(
          `Did not complete Alipay transaction, result: ${JSON.stringify(
            result,
          )}`,
        );
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
        });
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'placeOrder',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      const currentLocale = Locale.getLocale(req.locale.id);
      const orderModel = new OrderModel(order, {
        countryCode: currentLocale.country,
      });

      // Save orderModel to custom object during session
      Transaction.wrap(() => {
        order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
        AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
      });

      clearForms();
      res.redirect(
        URLUtils.url(
          'Order-Confirm',
          'ID',
          order.orderNo,
          'token',
          order.orderToken,
        ).toString(),
      );
      return next();
    }
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(
      URLUtils.url(
        'Checkout-Begin',
        'stage',
        'placeOrder',
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null),
      ),
    );
    return next();
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify /payment/details: ${e.message}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
