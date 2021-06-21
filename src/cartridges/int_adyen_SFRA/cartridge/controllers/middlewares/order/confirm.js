const OrderMgr = require('dw/order/OrderMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function handleAdyenGiving(req, res, order) {
  const clientKey = AdyenHelper.getAdyenClientKey();
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
    clientKey,
    environment,
    adyenGivingAvailable: true,
    pspReference: order.custom.Adyen_pspReference,
    donationAmounts: JSON.stringify(donationAmounts),
    charityName,
    charityDescription,
    charityWebsite,
    adyenGivingBackgroundUrl,
    adyenGivingLogoUrl,
  };
  res.setViewData(viewData);
}

function confirm(req, res, next) {
  if (req.querystring.ID) {
    const order = OrderMgr.getOrder(req.querystring.ID);
    const paymentMethod = order.custom.Adyen_paymentMethod;

    if (
      AdyenHelper.getAdyenGivingEnabled() &&
      AdyenHelper.isAdyenGivingAvailable(paymentMethod)
    ) {
      handleAdyenGiving(req, res, order);
    }
  }
  return next();
}

module.exports = confirm;
