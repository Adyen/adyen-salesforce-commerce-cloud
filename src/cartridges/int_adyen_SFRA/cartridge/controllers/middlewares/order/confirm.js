const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

// order-confirm is POST in SFRA v6.0.0. orderID is contained in form.
// This was a GET call with a querystring containing ID in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}

function handleAdyenGiving(req, res, order) {
  try {
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
  } catch (e) {
    Logger.getLogger('Adyen').error(
      'Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly',
    );
  }
}

function confirm(req, res, next) {
  const orderId = getOrderId(req);
  if (orderId) {
    const order = OrderMgr.getOrder(orderId);
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
