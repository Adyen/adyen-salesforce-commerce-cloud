import {
  doVippsPayment,
  doTrustlyPayment,
  completeVippsRedirect,
  completeTrustlyRedirect,
} from "../paymentFlows/redirectShopper"
import {regionsEnum} from "../data/enums";
import { environments } from "../data/environments"
const shopperData = require("../data/shopperData.json");

let checkoutPage;

for(const environment of environments) {
  fixture`${environment.name} NOK`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach(async t => {
        await t.maximizeWindow()
        // Set manual timeout due to slow redirect for Trustly
        checkoutPage = new environment.CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.NO);
        await checkoutPage.setShopperDetails(shopperData.NO);
      });

  test('Vipps Success', async () => {
    await doVippsPayment();
    await checkoutPage.completeCheckout();
    await completeVippsRedirect(true);
    // can only be tested up to redirect. No success assertion
  });

  test('Vipps Fail', async t => {
    await doVippsPayment();
    await checkoutPage.completeCheckout();
    await completeVippsRedirect(false);
    await checkoutPage.expectRefusal();
  });

  test.skip('Trustly Success', async () => {
      await doTrustlyPayment();
      await checkoutPage.completeCheckout();
      await completeTrustlyRedirect(true);
      await checkoutPage.expectSuccess();
    });

  test.skip('Trustly Fail', async () => {
    await doTrustlyPayment();
    await checkoutPage.completeCheckout();
    await completeTrustlyRedirect(false);
    await checkoutPage.expectRefusal();
  });
}


