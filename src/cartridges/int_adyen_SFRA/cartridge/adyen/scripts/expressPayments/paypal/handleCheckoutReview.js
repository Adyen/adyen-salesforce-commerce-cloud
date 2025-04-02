const URLUtils = require('dw/web/URLUtils');
const BasketMgr = require('dw/order/BasketMgr');
const Locale = require('dw/util/Locale');
const Transaction = require('dw/system/Transaction');
const AccountModel = require('*/cartridge/models/account');
const OrderModel = require('*/cartridge/models/order');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

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
function handleCheckoutReview(req, res, next) {
  try {
    if (!req.form.data) {
      throw new Error('State data not present in the request');
    }
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

    updateCurrentBasket(currentBasket, req);

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

    res.render('cart/checkoutReview', {
      data: req.form.data,
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
