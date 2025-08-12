const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

function submitCustomer(req, res, next) {
  let stage = 'shipping';
  const shopperDetails = JSON.parse(req.form.shopperDetails);
  if (shopperDetails) {
    const currentBasket = BasketMgr.getCurrentBasket();
    paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
    stage = 'payment';
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
