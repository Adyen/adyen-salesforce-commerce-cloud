const authorize = require('*/cartridge/scripts/hooks/payment/processor/middlewares/authorize');
const handle = require('*/cartridge/scripts/hooks/payment/processor/middlewares/handle');
const posHandle = require('*/cartridge/scripts/hooks/payment/processor/middlewares/posHandle');
const posAuthorize = require('*/cartridge/scripts/hooks/payment/processor/middlewares/posAuthorize');
const processForm = require('*/cartridge/scripts/hooks/payment/processor/middlewares/processForm');
const savePaymentInformation = require('*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation');

module.exports = {
  authorize,
  handle,
  posHandle,
  posAuthorize,
  processForm,
  savePaymentInformation,
};
