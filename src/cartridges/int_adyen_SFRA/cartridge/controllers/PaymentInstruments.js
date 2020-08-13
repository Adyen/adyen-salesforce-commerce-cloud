const server = require('server');

server.extend(module.superModule);

const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { paymentInstruments } = require('./middlewares/index');

server.prepend(
  'List',
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  (req, res, next) => {
    require('*/cartridge/scripts/updateSavedCards').updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
    next();
  },
);

server.prepend(
  'AddPayment',
  csrfProtection.generateToken,
  consentTracking.consent,
  userLoggedIn.validateLoggedIn,
  (req, res, next) => {
    const protocol = req.https ? 'https' : 'http';
    const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
      protocol,
      req.host,
    );
    const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const viewData = res.getViewData();
    viewData.adyen = {
      originKey,
      environment,
    };

    res.setViewData(viewData);
    next();
  },
);

server.prepend(
  'SavePayment',
  csrfProtection.validateAjaxRequest,
  paymentInstruments.savePayment,
);

server.append(
  'DeletePayment',
  userLoggedIn.validateLoggedInAjax,
  paymentInstruments.deletePayment,
);

module.exports = server.exports();
