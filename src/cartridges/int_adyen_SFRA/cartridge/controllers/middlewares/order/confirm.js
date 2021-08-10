const OrderMgr = require('dw/order/OrderMgr');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

// order-confirm is POST in SFRA v6.0.0. orderID is contained in form.
// This was a GET call with a querystring containing ID in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}

function confirm(req, res, next) {
  const orderId = getOrderId(req);
  const order = OrderMgr.getOrder(orderId);
  const paymentMethod = order.custom.Adyen_paymentMethod;

  if (
    AdyenHelper.getAdyenGivingEnabled() &&
    AdyenHelper.isAdyenGivingAvailable(paymentMethod)
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
      originKey,
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
  return next();
}

module.exports = confirm;
