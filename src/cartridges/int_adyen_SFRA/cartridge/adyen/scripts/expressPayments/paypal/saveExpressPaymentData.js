const URLUtils = require('dw/web/URLUtils');
const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');

/**
 * Sets Shipping and Billing address for the basket,
 * also updated payment method on the paymentInstrument of Basket.
 * @param {dw.order.Basket} currentBasket - the current basket
 * @param {sfra.Request} req - request object
 * @returns {undefined}
 */
function updateCurrentBasket(currentBasket, req) {
  const { details } = JSON.parse(req.form.data);
  if (currentBasket.shipments?.length <= 1) {
    req.session.privacyCache.set('usingMultiShipping', false);
  }
  const paymentInstrument = currentBasket.getPaymentInstruments()[0];
  Transaction.wrap(() => {
    currentBasket.custom.paypalExpressPaymentData = req.form.data;
    paymentInstrument.custom.adyenPaymentMethod =
      AdyenHelper.getAdyenComponentType(details?.paymentSource);
  });
}

/**
 * Controller for the checkout review page for express payment methods
 * @param {sfra.Request} req - request
 * @param {sfra.Response} res - response
 * @param {sfra.Next} next - next
 * @returns {sfra.Next} next - next
 */
// eslint-disable-next-line
function saveExpressPaymentData(req, res, next) {
  try {
    if (!req.form.data) {
      throw new AdyenError('State data not present in the request');
    }
    const parsedData = JSON.parse(req.form.data || '{}');
    const { isExpressPdp } = parsedData || {};
    const currentBasket = isExpressPdp
      ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
      : BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    const validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    updateCurrentBasket(currentBasket, req);
    res.json({
      success: true,
      redirectUrl: URLUtils.url('Adyen-CheckoutReview').toString(),
    });
  } catch (error) {
    AdyenLogs.error_log('Could not save paypal express payment data', error);
    setErrorType(error, res);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
  return next();
}

module.exports = saveExpressPaymentData;
