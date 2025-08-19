const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

function submitCustomer(req, res, next) {
  let stage = 'shipping';
  if (
    req.form.fastlaneShopperDetails &&
    !req.currentCustomer.raw.authenticated
  ) {
    try {
      const currentBasket = BasketMgr.getCurrentBasket();
      const fastlaneShopperDetails = JSON.parse(
        req.form.fastlaneShopperDetails,
      );
      if (currentBasket) {
        paypalHelper.setBillingAndShippingAddress(
          currentBasket,
          fastlaneShopperDetails,
        );
        stage = 'payment';
      }
    } catch (error) {
      AdyenLogs.error_log(
        'Failed to set billing and shipping address for fastlane',
        error,
      );
    }
    res.setViewData({
      fastlaneReturnUrl: URLUtils.url(
        'Checkout-Begin',
        'stage',
        stage,
      ).toString(),
    });
  }
  return next();
}

module.exports = submitCustomer;
