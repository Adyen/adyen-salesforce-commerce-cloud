const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
const { validateOrder } = require('*/cartridge/scripts/hooks/validateOrder');

function hasAdyenPaymentMethod(currentBasket) {
  let result = false;
  collections.forEach(
    currentBasket.getPaymentInstruments(),
    (paymentInstrument) => {
      if (
        [
          constants.METHOD_ADYEN,
          paymentInstrument.METHOD_CREDIT_CARD,
          constants.METHOD_ADYEN_POS,
          constants.METHOD_ADYEN_COMPONENT,
        ].indexOf(paymentInstrument.paymentMethod) !== -1
      ) {
        result = true;
      }
    },
  );
  return result;
}

function checkForErrors(currentBasket, res, req, emit) {
  const hasBasketErrors = () => {
    // Check to make sure there is a shipping address
    if (!currentBasket.defaultShipment.shippingAddress) {
      res.json({
        error: true,
        errorStage: {
          stage: 'shipping',
          step: 'address',
        },
        errorMessage: Resource.msg(
          'error.no.shipping.address',
          'checkout',
          null,
        ),
      });
      emit('route:Complete');
      return true;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
      res.json({
        error: true,
        errorStage: {
          stage: 'payment',
          step: 'billingAddress',
        },
        errorMessage: Resource.msg(
          'error.no.billing.address',
          'checkout',
          null,
        ),
      });
      emit('route:Complete');
      return true;
    }

    return false;
  };

  const hasGeneralErrors = () => {
    const viewData = res.getViewData();

    if (viewData?.csrfError) {
      res.json();
      emit('route:Complete');
      return true;
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
      res.json({
        error: true,
        cartError: true,
        redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      emit('route:Complete');
      return true;
    }

    const validationOrderStatus = hooksHelper(
      'app.validate.order',
      'validateOrder',
      currentBasket,
      validateOrder,
    );
    if (validationOrderStatus.error) {
      res.json({
        error: true,
        errorMessage: validationOrderStatus.message,
      });
      emit('route:Complete');
      return true;
    }
    return false;
  };

  return hasGeneralErrors() || hasBasketErrors();
}

module.exports = {
  hasAdyenPaymentMethod,
  checkForErrors,
};
