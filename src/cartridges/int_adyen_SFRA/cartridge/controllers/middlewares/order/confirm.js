const OrderMgr = require('dw/order/OrderMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

// order-confirm is POST in SFRA v6.0.0. orderID and orderToken are contained in form.
// This was a GET call with a querystring containing ID & token in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}

function getOrderToken(req) {
  return req.form && req.form.orderToken
    ? req.form.orderToken
    : req.querystring.token;
}

function handleAdyenGiving(req, res, order) {
  const clientKey = AdyenConfigs.getAdyenClientKey();
  const environment = AdyenHelper.getCheckoutEnvironment();
  const configuredAmounts = AdyenHelper.getDonationAmounts();
  const charityName = AdyenConfigs.getAdyenGivingCharityName();
  const charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
  const charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
  const adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
  const adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();

  const paymentInstrument = order.getPaymentInstruments(
    AdyenHelper.getOrderMainPaymentInstrumentType(order),
  )[0];

  const donationAmounts = {
    currency: session.currency.currencyCode,
    values: configuredAmounts,
  };
  const viewData = res.getViewData();
  viewData.adyen = {
    clientKey,
    environment,
    adyenGivingAvailable: true,
    pspReference:
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference,
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
  const orderToken = getOrderToken(req);
  if (orderId && orderToken) {
    const order = OrderMgr.getOrder(orderId, orderToken);
    const paymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    )[0];
    const paymentMethod =
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod;

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
