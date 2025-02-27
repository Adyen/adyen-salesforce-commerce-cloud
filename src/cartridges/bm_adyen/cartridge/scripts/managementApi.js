const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const bmHelper = require('*/cartridge/utils/helper');

function fetchAllStores() {
  const service = bmHelper.initializeAdyenService(
    constants.SERVICE.GETSTORES,
    'GET',
  );
  const merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  let stores = [];
  let nextPageUrl = service.getURL();

  while (nextPageUrl) {
    const callResult = service.call(JSON.stringify({ merchantAccount }));

    if (!callResult.isOk()) {
      throw new Error('/getStores call failed');
    }

    const response = JSON.parse(callResult.object.getText());
    stores = stores.concat(
      response.data.map(({ id, reference }) => ({ id, reference })),
    );

    nextPageUrl = response._links?.next?.href || null;
    if (nextPageUrl) {
      service.setURL(nextPageUrl);
    }
  }

  return stores;
}

module.exports = {
  fetchAllStores,
};
