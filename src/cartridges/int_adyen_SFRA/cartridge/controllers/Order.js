const OrderMgr = require('dw/order/OrderMgr');
const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

server.extend(module.superModule);

server.prepend(
  'Confirm',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  function (req, res, next) {
    const order = OrderMgr.getOrder(req.querystring.ID);
    const paymentMethod = order.custom.Adyen_paymentMethod;

    if (
      AdyenHelper.getAdyenGivingEnabled()
      && AdyenHelper.isAdyenGivingAvailable(paymentMethod)
    ) {
      const protocol = req.https ? 'https' : 'http';
      const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
        protocol,
        req.host,
      );
      const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
      const configuredAmounts = AdyenHelper.getDonationAmounts();
      const charityName = AdyenHelper.getAdyenGivingCharityName();
      const charityWebsite = AdyenHelper.getAdyenGivingCharityWebsite();
      const charityDescription = AdyenHelper.getAdyenGivingCharityDescription();
      const adyenGivingBackgroundUrl = AdyenHelper.getAdyenGivingBackgroundUrl();
      const adyenGivingLogoUrl = AdyenHelper.getAdyenGivingLogoUrl();

      const donationAmounts = {
        currency: session.currency.currencyCode,
        values: configuredAmounts,
      };

      const viewData = res.getViewData();
      viewData.adyen = {
        originKey: originKey,
        environment: environment,
        adyenGivingAvailable: true,
        pspReference: order.custom.Adyen_pspReference,
        donationAmounts: JSON.stringify(donationAmounts),
        charityName: charityName,
        charityDescription: charityDescription,
        charityWebsite: charityWebsite,
        adyenGivingBackgroundUrl: adyenGivingBackgroundUrl,
        adyenGivingLogoUrl: adyenGivingLogoUrl,
      };
      res.setViewData(viewData);
    }
    return next();
  },
);

module.exports = server.exports();
