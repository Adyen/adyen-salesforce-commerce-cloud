// const { getPaymentMethods } = require('../commons');

function init() {
  $(document).ready(async () => {
    $.spinner().start();
    // const paymentMethods = await getPaymentMethods();
    // const paymentMethodsResponse = await paymentMethods.json();
    $.spinner().stop();
  });
}

module.exports = {
  init,
};
