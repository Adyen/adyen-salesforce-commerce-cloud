const OrderMgr = require('dw/order/OrderMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

// order-confirm is POST in SFRA v6.0.0. orderID is contained in form.
// This was a GET call with a querystring containing ID in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}

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
  const orderId = getOrderId(req);
  if (orderId) {
    const order = OrderMgr.getOrder(orderId);
    const paymentMethod = order.custom.Adyen_paymentMethod;

    if (
      AdyenHelper.getAdyenGivingConfig(order) &&
      AdyenHelper.isAdyenGivingAvailable(paymentMethod)
    ) {
      handleAdyenGiving(req, res, order);
    }
  }
  return next();
}

module.exports = confirm;
