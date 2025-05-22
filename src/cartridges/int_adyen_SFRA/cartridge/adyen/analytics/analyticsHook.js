const URLRedirectMgr = require('dw/web/URLRedirectMgr');
const analyticsEvent = require('*/cartridge/adyen/analytics/analyticsEvents');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const constants = require('*/cartridge/adyen/config/constants');
const {
  isAdyenAnalyticsEnabled,
} = require('*/cartridge/adyen/utils/adyenConfigs');

function getPath(req) {
  return req.path.split('/').pop().split('-');
}

function redirectUrlStartRule() {
  const origin = URLRedirectMgr.redirectOrigin;
  return origin.match(constants.APPLE_DOMAIN_URL);
}

function isUsedByAdyen(req) {
  const path = getPath(req);
  const allControllers = [
    { name: 'account', routes: [{ name: 'Show' }] },
    { name: 'adyen' },
    { name: 'cart', routes: [{ name: 'MiniCartShow' }] },
    { name: 'checkout', routes: [{ name: 'Begin' }] },
    { name: 'checkoutServices', routes: [{ name: 'PlaceOrder' }] },
    { name: 'order', routes: [{ name: 'Confirm' }] },
    {
      name: 'paymentInstruments',
      routes: [
        { name: 'AddPayment' },
        { name: 'SavePayment' },
        { name: 'DeletePayment' },
      ],
    },
    {
      name: 'redirectUrl',
      routes: [{ name: 'Start', rule: redirectUrlStartRule }],
    },
  ];
  return allControllers.some((controller) => {
    if (path[0].toLowerCase() === controller.name.toLowerCase()) {
      if (!controller.routes) {
        return true;
      }
      const route = controller.routes.find(
        (eachRoute) => path[1].toLowerCase() === eachRoute.name.toLowerCase(),
      );
      if (typeof route?.rule === 'function') {
        return !!route.rule();
      }
      return !!route;
    }
    return false;
  });
}

function onStartHandler(req) {
  const path = getPath(req);
  if (isUsedByAdyen(req) && isAdyenAnalyticsEnabled()) {
    analyticsEvent.createAnalyticsEvent(
      session.sessionID.slice(0, 200),
      path.join('-'),
      analyticsConstants.eventType.EXPECTED_START,
      analyticsConstants.eventCode.INFO,
    );
  }
}

function onCompleteHandler(req, res) {
  const path = getPath(req);
  const hasError = !!res.viewData?.error;
  if (isUsedByAdyen(req) && isAdyenAnalyticsEnabled()) {
    if (hasError) {
      analyticsEvent.createAnalyticsEvent(
        session.sessionID.slice(0, 200),
        path.join('-'),
        analyticsConstants.eventType.UNEXPECTED_END,
        analyticsConstants.eventCode.INFO,
      );
      analyticsEvent.createAnalyticsEvent(
        session.sessionID.slice(0, 200),
        path.join('-'),
        analyticsConstants.eventType.UNEXPECTED_END,
        analyticsConstants.eventCode.ERROR,
      );
    } else {
      analyticsEvent.createAnalyticsEvent(
        session.sessionID.slice(0, 200),
        path.join('-'),
        analyticsConstants.eventType.EXPECTED_END,
        analyticsConstants.eventCode.INFO,
      );
    }
  }
}

function registerRoute(route) {
  route.on('route:Start', onStartHandler);
  route.on('route:Complete', onCompleteHandler);
}

/* Module Exports */
module.exports = {
  registerRoute,
  getPath,
  redirectUrlStartRule,
  isUsedByAdyen,
  onStartHandler,
  onCompleteHandler,
};
