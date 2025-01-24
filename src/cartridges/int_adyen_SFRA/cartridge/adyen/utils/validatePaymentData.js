const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function validateBasketAmount(currentBasket) {
  if (!currentBasket || currentBasket.totalGrossPrice <= 0) {
    throw new Error(
      'Cannot complete a payment with an amount lower or equal to zero',
    );
  }
}

function validatePaymentDataFromRequest(req, res, next) {
  try {
    const { isExpressPdp } = req.form?.data ? JSON.parse(req.form.data) : null;
    const currentBasket = isExpressPdp
      ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
      : BasketMgr.getCurrentBasket();
    validateBasketAmount(currentBasket);
    return next();
  } catch (e) {
    AdyenLogs.fatal_log(`Error occurred: ${e.message}`);
    return res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}

module.exports = validatePaymentDataFromRequest;
