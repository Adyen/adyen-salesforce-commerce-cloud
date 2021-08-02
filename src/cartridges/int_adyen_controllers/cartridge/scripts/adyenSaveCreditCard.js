const app = require('app_storefront_controllers/cartridge/scripts/app');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');
const adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const Logger = require('dw/system/Logger');

function create() {
  const paymentInformation = app.getForm('adyPaydata');
  const wallet = customer.getProfile().getWallet();

  let paymentInstrument;
  Transaction.wrap(() => {
    paymentInstrument = wallet.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation
      .get('adyenStateData')
      .value();
  });

  Transaction.begin();
  const zeroAuthResult = adyenZeroAuth.zeroAuthPayment(
    customer,
    paymentInstrument,
  );
  Logger.getLogger('Adyen').error('zeroAuthResult ' + JSON.stringify(zeroAuthResult));

  // const response = AdyenHelper.createAdyenCheckoutResponse(zeroAuthResult);
  if(zeroAuthResult.action) {
    return zeroAuthResult.action;
  }

  if (zeroAuthResult.error || zeroAuthResult.resultCode !== 'Authorised') {
    Transaction.rollback();
    return false;
  }

  Transaction.commit();
  return true;
}

module.exports = {
  create,
};
