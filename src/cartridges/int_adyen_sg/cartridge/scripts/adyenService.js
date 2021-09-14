const app = require('app_storefront_controllers/cartridge/scripts/app');

const OrderModel = app.getModel('Order');

function submit(order) {
  return OrderModel.submit(order);
}

module.exports = {
  submit,
};
