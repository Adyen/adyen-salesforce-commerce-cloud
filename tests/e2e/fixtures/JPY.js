import { regionsEnum } from "../data/enums";
import { environments } from "../data/environments"
import { doKonbiniPayment } from "../paymentFlows/pending";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

for(const environment of environments) {
  fixture`${environment.name} JPY`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach(async t => {
        await t.maximizeWindow()
        checkoutPage = new environment.CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.JP);
        await checkoutPage.setShopperDetails(shopperData.JP);
      });

  test('konbini Success', async t => {
    await doKonbiniPayment();
    await checkoutPage.completeCheckout();
    await checkoutPage.expectSuccess();
    await checkoutPage.expectVoucher();
  });
}



