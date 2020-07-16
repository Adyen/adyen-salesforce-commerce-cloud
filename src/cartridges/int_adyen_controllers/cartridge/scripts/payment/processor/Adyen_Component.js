/* API Includes */
const URLUtils = require('dw/web/URLUtils');
const PaymentMgr = require('dw/order/PaymentMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');

/* Script Modules */
const app = require(Resource.msg('scripts.app.js', 'require', null)); // eslint-disable-line import/no-dynamic-require
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
  const currentBasket = args.Basket;
  const paymentInformation = app.getForm('adyPaydata');

  Transaction.wrap(function () {
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

  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  Transaction.begin();
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
        !empty(args)
        && 'AdyenErrorMessage' in args
        && !empty(args.AdyenErrorMessage)
          ? args.AdyenErrorMessage
          : '',
    };
  }

  if (result.pspReference) {
    order.custom.Adyen_pspReference = result.pspReference;
  }

  if (result.threeDS2 || result.resultCode === 'RedirectShopper') {
    paymentInstrument.custom.adyenPaymentData = result.paymentData;
    Transaction.commit();

    session.privacy.orderNo = order.orderNo;
    session.privacy.paymentMethod = paymentInstrument.paymentMethod;

    if (result.threeDS2) {
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https(
            'Adyen-Redirect3DS2',
            'utm_nooverride',
            '1',
          ),
          resultCode: result.resultCode,
          token3ds2: result.token3ds2,
        }),
      };
    }

    // If the response has MD, then it is a 3DS transaction
    if (
      result.redirectObject
      && result.redirectObject.data
      && result.redirectObject.data.MD
    ) {
      session.privacy.MD = result.redirectObject.data.MD;
      return {
        authorized3d: true,
        view: app.getView({
          ContinueURL: URLUtils.https(
            'Adyen-AuthorizeWithForm',
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
      order: order,
      paymentInstrument: paymentInstrument,
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
