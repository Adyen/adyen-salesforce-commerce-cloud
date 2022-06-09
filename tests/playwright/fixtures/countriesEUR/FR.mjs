import {
  doOneyPayment,
  completeOneyRedirect,
} from '../../paymentFlows/redirectShopper.mjs';
const shopperData = require('../../data/shopperData.mjs');

module.exports = (checkoutPage) => {
  test.skip('Oney Success', async (t) => {
    await checkoutPage.setShopperDetails(shopperData.FR);
    await doOneyPayment(shopperData.FR);
    await checkoutPage.completeCheckout();
    await completeOneyRedirect();
    await checkoutPage.expectSuccess();
  });

  test.skip('Oney Fail', async (t) => {
    await checkoutPage.setShopperDetails(shopperData.FR);
    await doOneyPayment(false);
    await checkoutPage.completeCheckout();
    await completeOneyRedirect();
    await checkoutPage.expectRefusal();
  });
};
