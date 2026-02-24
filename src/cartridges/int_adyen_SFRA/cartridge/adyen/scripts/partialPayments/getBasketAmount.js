const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');

function getBasketAmount(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
      res.json({
        error: true,
        message: 'No basket found',
      });
      return next();
    }

    const totalGrossPrice = currentBasket.getTotalGrossPrice();
    const divideBy = AdyenHelper.getDivisorForCurrency({
      currencyCode: totalGrossPrice.currencyCode,
    });

    res.json({
      basketAmount: {
        currency: totalGrossPrice.currencyCode,
        value: totalGrossPrice.multiply(divideBy).value,
      },
    });
  } catch (error) {
    AdyenLogs.error_log('Failed to get basket amount:', error);
    setErrorType(error, res);
  }

  return next();
}

module.exports = getBasketAmount;
