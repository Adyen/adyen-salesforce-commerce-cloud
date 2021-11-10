import {
  doMobilePayPayment,
  completeMobilePayRedirect,
} from "../paymentFlows/redirectShopper";
import { environments } from "../data/environments"
import {regionsEnum} from "../data/enums";

const shopperData = require("../data/shopperData.json");

let checkoutPage;

for(const environment of environments) {
  fixture`${environment.name} DKK`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach( async t => {
        await t.maximizeWindow()
        checkoutPage = new environment.CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.DK);
        await checkoutPage.setShopperDetails(shopperData.DK);
      });

  test('MobilePay', async () => {
    await doMobilePayPayment();
    await checkoutPage.completeCheckout();
    await completeMobilePayRedirect();
    // can only be tested up to redirect. No success assertion
  });
}
