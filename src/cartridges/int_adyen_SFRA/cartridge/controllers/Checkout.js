const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

server.extend(module.superModule);

server.prepend(
  'Begin',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  function (req, res, next) {
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
      originKey: originKey,
      environment: environment,
      installments: installments,
      paypalMerchantID: paypalMerchantID,
      googleMerchantID: googleMerchantID,
      merchantAccount: merchantAccount,
    };

    res.setViewData(viewData);
    next();
  },
);

module.exports = server.exports();
