/* API Includes */
const URLUtils = require('dw/web/URLUtils');
const PaymentMgr = require('dw/order/PaymentMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');

/* Script Modules */
const app = require(Resource.msg('scripts.app.js', 'require', null));
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
  const currentBasket = args.Basket;
  const paymentInformation = app.getForm('adyPaydata');

  Transaction.wrap(() => {
    const result = adyenRemovePreviousPI.removePaymentInstruments(
      currentBasket,
    );
    if (result.error) {
      return result;
    }
    const paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation
      .get('adyenStateData')
      .value();
    session.privacy.adyenFingerprint = paymentInformation
      .get('adyenFingerprint')
      .value();
  });

  return { success: true };
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  const order = args.Order;
  const paymentInstrument = args.PaymentInstrument;
  const paymentProcessor = PaymentMgr.getPaymentMethod(
    paymentInstrument.getPaymentMethod(),
  ).getPaymentProcessor();

  Transaction.begin();
  paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;

  const orderCustomer = order.getCustomer();
  const sessionCustomer = session.getCustomer();
  if (orderCustomer.authenticated && orderCustomer.ID !== sessionCustomer.ID) {
    Logger.getLogger('Adyen').error('orderCustomer is not the same as the sessionCustomer');
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    return {
      error: true,
      PlaceOrderError: 'orderCustomer is not the same as the sessionCustomer',
    };
  }

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  if (result.error) {
    Transaction.rollback();
    const args = 'args' in result ? result.args : null;

    return {
      error: true,
      PlaceOrderError:
        !empty(args) &&
        'AdyenErrorMessage' in args &&
        !empty(args.AdyenErrorMessage)
          ? args.AdyenErrorMessage
          : '',
    };
  }

  if (result.pspReference) {
    order.custom.Adyen_pspReference = result.pspReference;
  }

  if (result.threeDS2 || result.resultCode === constants.RESULTCODES.REDIRECTSHOPPER) {
    paymentInstrument.custom.adyenPaymentData = result.paymentData;
    Transaction.commit();

    if (result.threeDS2) {
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenAction = JSON.stringify(result.fullResponse.action);
      });
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https(
            'Adyen-Redirect3DS2',
            'merchantReference',
            order.orderNo,
              'orderToken',
              order.getOrderToken(),
            'utm_nooverride',
            '1',
          ),
          resultCode: result.resultCode,
          token3ds2: result.token3ds2,
        }),
      };
    }

    // If the response has MD, then it is a 3DS transaction
    if (result.redirectObject?.data?.MD) {
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenMD = result.redirectObject.data.MD;
      });
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https(
            'Adyen-AuthorizeWithForm',
            'merchantReference',
            order.orderNo,
              'orderToken',
              order.getOrderToken(),
            'utm_nooverride',
            '1',
          ),
          Basket: order,
          issuerUrl: result.redirectObject.url,
          paRequest: result.redirectObject.data.PaReq,
          md: result.redirectObject.data.MD,
        }),
      };
    }

    return {
      order,
      paymentInstrument,
      redirectObject: result.redirectObject,
    };
  }

  if (result.decision !== 'ACCEPT') {
    Transaction.rollback();
    return {
      error: true,
      PlaceOrderError:
        'AdyenErrorMessage' in result && !empty(result.adyenErrorMessage)
          ? result.adyenErrorMessage
          : '',
    };
  }

  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  Transaction.commit();

  return { authorized: true };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
