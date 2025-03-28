const OrderMgr = require('dw/order/OrderMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const adyenGiving = require('*/cartridge/adyen/scripts/donations/adyenGiving');

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

function handleAdyenGiving(req, res) {
  const clientKey = AdyenConfigs.getAdyenClientKey();
  const environment = AdyenHelper.getCheckoutEnvironment();
  const campaign = adyenGiving.getActiveCampaigns().donationCampaigns[0];
  const { nonprofitUrl, logoUrl, bannerUrl, termsAndConditionsUrl } = campaign;
  const donationProperties = JSON.stringify(campaign.donation);
  const nonprofitName = encodeURI(campaign.nonprofitName);
  const nonprofitDescription = encodeURI(campaign.nonprofitDescription);
  const orderToken = getOrderToken(req);

  const viewData = res.getViewData();
  viewData.adyen = {
    clientKey,
    environment,
    adyenGivingAvailable: true,
    donationProperties,
    nonprofitName,
    nonprofitDescription,
    nonprofitUrl,
    logoUrl,
    bannerUrl,
    termsAndConditionsUrl,
    orderToken,
  };
  res.setViewData(viewData);
}

function confirm(req, res, next) {
  const orderId = getOrderId(req);
  const orderToken = getOrderToken(req);
  if (orderId && orderToken) {
    const order = OrderMgr.getOrder(orderId, orderToken);
    if (AdyenHelper.isAdyenGivingAvailable(order)) {
      handleAdyenGiving(req, res);
    }
  }
  return next();
}

module.exports = confirm;
