const app = require('app_storefront_controllers/cartridge/scripts/app');

const OrderModel = app.getModel('Order');

function submit(order) {
  return OrderModel.submit(order);
}

const EXTERNAL_PLATFORM_VERSION = 'SG';
function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = {
  submit,
  getExternalPlatformVersion
};
