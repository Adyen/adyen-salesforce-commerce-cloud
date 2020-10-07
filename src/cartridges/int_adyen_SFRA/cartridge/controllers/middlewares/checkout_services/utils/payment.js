const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

function handlePaymentAuthorization(order, { res }, emit) {
  const handleRedirectResult = (handlePaymentResult) => {
    Logger.getLogger('Adyen').error(
      `handlePaymentResult = ${JSON.stringify(handlePaymentResult)}`,
    );
    if (handlePaymentResult.threeDS2) {
      res.json({
        error: false,
        continueUrl: URLUtils.url(
          'Adyen-Adyen3DS2',
          'resultCode',
          handlePaymentResult.resultCode,
          'action',
          handlePaymentResult.action,
        ).toString(),
      });
      emit('route:Complete');
      return false;
    }

    if (handlePaymentResult.redirectObject) {
      // If authorized3d, then redirectObject from credit card, hence it is 3D Secure
      if (handlePaymentResult.authorized3d) {
        session.privacy.MD = handlePaymentResult.redirectObject.data.MD;
        res.json({
          error: false,
          continueUrl: URLUtils.url(
            'Adyen-Adyen3D',
            'IssuerURL',
            handlePaymentResult.redirectObject.url,
            'PaRequest',
            handlePaymentResult.redirectObject.data.PaReq,
            'MD',
            handlePaymentResult.redirectObject.data.MD,
            'signature',
            handlePaymentResult.signature,
            'merchantReference',
            order.orderNo,
          ).toString(),
        });
        emit('route:Complete');
        return false;
      }
      res.json({
        error: false,
        continueUrl: URLUtils.url(
          'Adyen-Redirect',
          'redirectUrl',
          handlePaymentResult.redirectObject.url,
          'signature',
          handlePaymentResult.signature,
          'merchantReference',
          order.orderNo,
        ).toString(),
      });
      emit('route:Complete');
      return false;
    }

    return true;
  };

  // Handles payment authorization
  const handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
    });
    emit('route:Complete');
    return false;
  }

  return handleRedirectResult(handlePaymentResult);
}

module.exports = handlePaymentAuthorization;
