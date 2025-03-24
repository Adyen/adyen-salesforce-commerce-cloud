const URLUtils = require('dw/web/URLUtils');
const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const AccountModel = require('*/cartridge/models/account');
const OrderModel = require('*/cartridge/models/order');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/**
 * Controller for the checkout review page for express payment methods
 * @param {sfra.Request} req - request
 * @param {sfra.Response} res - response
 * @param {sfra.Next} next - next
 * @returns {sfra.Next} next - next
 */
function handleCheckoutReview(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    const validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    const currentCustomer = req.currentCustomer.raw;
    const currentLocale = Locale.getLocale(req.locale.id);
    const usingMultiShipping =
      req.session.privacyCache.get('usingMultiShipping');

    const orderModel = new OrderModel(currentBasket, {
      customer: currentCustomer,
      usingMultiShipping,
      shippable: true,
      countryCode: currentLocale.country,
      containerView: 'basket',
    });

    const accountModel = new AccountModel(req.currentCustomer);
    const { paypalExpressPaymentData } = currentBasket.custom;
    res.render('cart/checkoutReview', {
      data: paypalExpressPaymentData,
      showConfirmationUrl: URLUtils.https(
        'Adyen-ShowConfirmationPaymentFromComponent',
      ),
      order: orderModel,
      customer: accountModel,
    });
  } catch (error) {
    AdyenLogs.error_log('Could not render checkout review page', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
  return next();
}

module.exports = handleCheckoutReview;
