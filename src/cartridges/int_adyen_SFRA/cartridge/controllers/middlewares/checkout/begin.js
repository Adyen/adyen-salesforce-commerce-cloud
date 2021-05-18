const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { updateSavedCards } = require('*/cartridge/scripts/updateSavedCards');

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
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
  const amazonMerchantID = AdyenHelper.getAmazonMerchantID();
  const amazonStoreID = AdyenHelper.getAmazonStoreID();
  const amazonPublicKeyID= AdyenHelper.getAmazonPublicKeyID();
  const googleMerchantID = AdyenHelper.getGoogleMerchantID();
  const merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  const cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  const paypalIntent = AdyenHelper.getAdyenPayPalIntent();

  const viewData = res.getViewData();
  viewData.adyen = {
    originKey,
    environment,
    installments,
    paypalMerchantID,
    amazonMerchantID,
    amazonStoreID,
    amazonPublicKeyID,
    googleMerchantID,
    merchantAccount,
    cardholderNameBool,
    paypalIntent,
  };

  res.setViewData(viewData);
  next();
}
module.exports = begin;
