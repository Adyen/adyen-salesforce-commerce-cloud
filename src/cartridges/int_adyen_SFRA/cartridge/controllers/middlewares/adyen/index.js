const adyen3d = require('./adyen3d');
const adyen3ds2 = require('./adyen3ds2');
const authorizeWithForm = require('./authorizeWithForm');
const authorize3ds2 = require('./authorize3ds2');
const redirect = require('./redirect');
const showConfirmation = require('./showConfirmation');
const getPaymentMethods = require('./getPaymentMethods');
const paymentFromComponent = require('./paymentFromComponent');
const notify = require('./notify');
const showConfirmationPaymentFromComponent = require('./showConfirmationPaymentFromComponent');
const confirmRedirectResult = require('./confirmRedirectResult');

module.exports = {
  adyen3d,
  adyen3ds2,
  authorizeWithForm,
  authorize3ds2,
  redirect,
  showConfirmation,
  getPaymentMethods,
  paymentFromComponent,
  notify,
  showConfirmationPaymentFromComponent,
  confirmRedirectResult,
};
