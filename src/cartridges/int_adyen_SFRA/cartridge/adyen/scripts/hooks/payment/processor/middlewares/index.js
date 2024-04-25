const authorize = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize');
const handle = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/handle');
const posHandle = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/posHandle');
const posAuthorize = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/posAuthorize');
const processForm = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/processForm');
const savePaymentInformation = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/savePaymentInformation');

module.exports = {
  authorize,
  handle,
  posHandle,
  posAuthorize,
  processForm,
  savePaymentInformation,
};
