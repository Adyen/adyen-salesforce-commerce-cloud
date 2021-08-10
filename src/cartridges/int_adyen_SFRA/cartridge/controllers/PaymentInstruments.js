const server = require('server');

server.extend(module.superModule);

const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { updateSavedCards } = require('*/cartridge/scripts/updateSavedCards');
const { paymentInstruments } = require('./middlewares/index');

/*
 * Prepends PaymentInstruments' 'List' function to list saved cards.
 */
server.prepend(
  'List',
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  (req, res, next) => {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
    next();
  },
);

/*
 * Prepends PaymentInstruments' 'AddPayment' function to pass Adyen-specific configurations.
 */
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

/*
 * Prepends PaymentInstruments' 'SavePayment' function to handle saving a payment instrument
 *  when the selected payment processor is Adyen.
 */
server.prepend(
  'SavePayment',
  csrfProtection.validateAjaxRequest,
  paymentInstruments.savePayment,
);

/*
 * Prepends PaymentInstruments' 'DeletePayment' function to handle deleting a payment instrument
 *  when the selected payment processor is Adyen.
 */
server.append(
  'DeletePayment',
  userLoggedIn.validateLoggedInAjax,
  paymentInstruments.deletePayment,
);

module.exports = server.exports();
