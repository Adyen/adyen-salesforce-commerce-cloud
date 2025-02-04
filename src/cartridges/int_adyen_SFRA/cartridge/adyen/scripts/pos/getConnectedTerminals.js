const PaymentMgr = require('dw/order/PaymentMgr');
const adyenTerminalApi = require('*/cartridge/adyen/scripts/pos/adyenTerminalApi');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

function getConnectedTerminals(req, res, next) {
  try {
    const requestObject = {};
    const getTerminalRequest = {};
    const { storeId } = JSON.parse(req.form.data);
    const activatedStores = AdyenConfigs.getAdyenActiveStoreId();
    getTerminalRequest.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
    getTerminalRequest.store = storeId;
    requestObject.request = getTerminalRequest;

    if (
      PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive() &&
      activatedStores.includes(storeId)
    ) {
      const response = adyenTerminalApi.executeCall(
        constants.SERVICE.CONNECTEDTERMINALS,
        requestObject,
      );
      res.json({ ...response });
    }
  } catch (error) {
    AdyenLogs.fatal_log('/getConnectedTerminals call failed', error);
    res.json({
      error: true,
    });
  }
  return next();
}

module.exports = getConnectedTerminals;
