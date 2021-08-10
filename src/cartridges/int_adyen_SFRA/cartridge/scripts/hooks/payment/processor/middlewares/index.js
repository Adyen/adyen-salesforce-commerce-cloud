const authorize = require('./authorize');
const handle = require('./handle');
const posHandle = require('./posHandle');
const posAuthorize = require('./posAuthorize');
const processForm = require('./processForm');
const savePaymentInformation = require('./savePaymentInformation');

module.exports = {
  authorize,
  handle,
  posHandle,
  posAuthorize,
  processForm,
  savePaymentInformation,
};
