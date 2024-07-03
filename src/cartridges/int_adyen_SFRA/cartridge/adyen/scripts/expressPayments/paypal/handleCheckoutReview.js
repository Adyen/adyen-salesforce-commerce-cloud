const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handleCheckoutReview(req, res, next) {
  try {
    if (!req.form.data) {
      throw new Error('State data not present in the request');
    }
    res.render('cart/checkoutReview', {
      data: req.form.data,
      showConfirmationUrl: URLUtils.https(
        'Adyen-ShowConfirmationPaymentFromComponent',
      ),
      // additional data may be required later
    });
  } catch (error) {
    AdyenLogs.error_log('Could not render checkout review page', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
  return next();
}

module.exports = handleCheckoutReview;
