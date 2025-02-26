"use strict";

var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var constants = require('*/cartridge/adyen/config/constants');
var bmHelper = require('*/cartridge/utils/helper');
function fetchAllStores() {
  var service = bmHelper.initializeAdyenService(constants.SERVICE.GETSTORES, 'GET');
  var merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
  var stores = [];
  var nextPageUrl = service.getURL();
  while (nextPageUrl) {
    var _response$_links, _response$_links$next;
    var callResult = service.call(JSON.stringify({
      merchantAccount: merchantAccount
    }));
    if (!callResult.isOk()) {
      throw new Error('/getStores call failed');
    }
    var response = JSON.parse(callResult.object.getText());
    stores = stores.concat(response.data.map(function (_ref) {
      var id = _ref.id,
        reference = _ref.reference;
      return {
        id: id,
        reference: reference
      };
    }));
    nextPageUrl = ((_response$_links = response._links) === null || _response$_links === void 0 ? void 0 : (_response$_links$next = _response$_links.next) === null || _response$_links$next === void 0 ? void 0 : _response$_links$next.href) || null;
    if (nextPageUrl) {
      service.setURL(nextPageUrl);
    }
  }
  return stores;
}
module.exports = {
  fetchAllStores: fetchAllStores
};