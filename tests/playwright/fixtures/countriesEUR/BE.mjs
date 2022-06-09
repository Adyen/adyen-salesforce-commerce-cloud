import { doQRCodePayment } from '../../paymentFlows/pending.mjs';

const shopperData = require('../../data/shopperData.mjs');
module.exports = (checkoutPage, environment) => {
  test('bcmc mobile renders', async (page) => {
    await checkoutPage.setShopperDetails(shopperData.BE);
    if (environment.name === 'SG') await checkoutPage.setEmail();
    await doQRCodePayment('bcmc_mobile', environment.name);
    if (environment.name === 'SFRA') await checkoutPage.completeCheckout();
    await checkoutPage.expectQRcode();
  });
};
