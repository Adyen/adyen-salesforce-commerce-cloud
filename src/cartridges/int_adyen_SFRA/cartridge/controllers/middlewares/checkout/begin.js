const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { updateSavedCards } = require('*/cartridge/scripts/updateSavedCards');
const Logger = require('dw/system/Logger');

function begin(req, res, next) {
  Logger.getLogger('Adyen').error(`Checkout-Bwgin prepend`);
  Logger.getLogger('Adyen').error(`Checkout req querystring = ${JSON.stringify(req.querystring)}`);
  Logger.getLogger('Adyen').error(`Checkout req = ${JSON.stringify(req)}`);
  if(req.querystring.redirectResult && req.querystring.stage === 'placeOrder'){
    Logger.getLogger('Adyen').error(`Checkout skip begin`);
    res.render('checkout/checkout', {
      // order: orderModel,
      // customer: accountModel,
      // forms: {
      //   guestCustomerForm: guestCustomerForm,
      //   registeredCustomerForm: registeredCustomerForm,
      //   shippingForm: shippingForm,
      //   billingForm: billingForm
      // },
      // expirationYears: creditCardExpirationYears,
      // currentStage: currentStage,
      // reportingURLs: reportingURLs,
      // oAuthReentryEndpoint: 2
    });
    emit('route:Complete');
    return next();
  }
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
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
