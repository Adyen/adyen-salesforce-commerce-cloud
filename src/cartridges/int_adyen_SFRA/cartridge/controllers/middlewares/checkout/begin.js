const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    require('*/cartridge/scripts/updateSavedCards').updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
  }

  const protocol = req.https ? 'https' : 'http';
  const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
    protocol,
    req.host,
  );
  const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  const installments = AdyenHelper.getCreditCardInstallments();
  const paypalMerchantID = AdyenHelper.getPaypalMerchantID();
  const googleMerchantID = AdyenHelper.getGoogleMerchantID();
  const merchantAccount = AdyenHelper.getAdyenMerchantAccount();

  const viewData = res.getViewData();
  viewData.adyen = {
    originKey,
    environment,
    installments,
    paypalMerchantID,
    googleMerchantID,
    merchantAccount,
  };

  res.setViewData(viewData);
  next();
}
module.exports = begin;
