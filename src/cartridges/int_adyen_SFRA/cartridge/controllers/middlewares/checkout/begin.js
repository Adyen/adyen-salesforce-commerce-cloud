const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { updateSavedCards } = require('*/cartridge/scripts/updateSavedCards');

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
  }

  // restore cart if order number was cached
  try {
    const cachedOrderNumber = req.session.privacyCache.get(
      'currentOrderNumber',
    );

    if (cachedOrderNumber !== null) {
      const currentBasket = BasketMgr.getCurrentBasket();
      const currentOrder = OrderMgr.getOrder(cachedOrderNumber);

      // if current basket is null or empty
      if (
        !currentBasket ||
        currentBasket.getAllProductLineItems().length === 0
      ) {
        // if order status is CREATED we can fail it and restore basket
        if (currentOrder?.status.value === Order.ORDER_STATUS_CREATED) {
          Transaction.wrap(() => {
            currentOrder.trackOrderChange(
              'Failing order so cart can be restored; Shopper navigated back to checkout during payment redirection',
            );
            OrderMgr.failOrder(currentOrder, true);
          });
        }
      }
    }
  } catch (error) {
    Logger.getLogger('Adyen').error(`Failed to restore cart. error: ${error}`);
  }

  const clientKey = AdyenHelper.getAdyenClientKey();
  const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  const installments = AdyenHelper.getCreditCardInstallments();
  const adyenClientKey = AdyenHelper.getAdyenClientKey();
  const googleMerchantID = AdyenHelper.getGoogleMerchantID();
  const merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  const cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  const paypalIntent = AdyenHelper.getAdyenPayPalIntent();

  const viewData = res.getViewData();
  viewData.adyen = {
    clientKey,
    environment,
    installments,
    googleMerchantID,
    merchantAccount,
    cardholderNameBool,
    paypalIntent,
    adyenClientKey,
  };

  res.setViewData(viewData);
  next();
}
module.exports = begin;
