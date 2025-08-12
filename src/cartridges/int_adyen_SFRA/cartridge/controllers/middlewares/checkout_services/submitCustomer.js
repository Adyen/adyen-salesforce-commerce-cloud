const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

function submitCustomer(req, res, next) {
  let stage = 'shipping';
  if (req.form.shopperDetails) {
    try {
      const currentBasket = BasketMgr.getCurrentBasket();
      const shopperDetails = JSON.parse(req.form.shopperDetails);
      if (shopperDetails && currentBasket) {
        paypalHelper.setBillingAndShippingAddress(
          currentBasket,
          shopperDetails,
        );
        stage = 'payment';
      }
    } catch (error) {
      AdyenLogs.error_log(
        'Failed to set billing and shipping address for fastlane',
        error,
      );
    }
  }
  res.setViewData({
    fastlaneReturnUrl: URLUtils.url(
      'Checkout-Begin',
      'stage',
      stage,
    ).toString(),
  });
  return next();
}

module.exports = submitCustomer;
