import { regionsEnum } from "../data/enums";
import { environments } from "../data/environments"
import {doQRCodePayment} from "../paymentFlows/pending";
import {completeKlarnaRedirectWithIDNumber, doKlarnaPayment} from "../paymentFlows/redirectShopper";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

for(const environment of environments) {
  fixture`${environment.name} SEK`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach(async t => {
        await t.maximizeWindow()
        checkoutPage = new environment.CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.SE);
        await checkoutPage.setShopperDetails(shopperData.SE);
      });

      test('Swish success', async () => {
        if(environment.name === "SG")
          await checkoutPage.setEmail();
        await doQRCodePayment("swish", environment.name);
        if(environment.name.includes("SFRA"))
          await checkoutPage.completeCheckout();
        await checkoutPage.expectQRcode();
      });

    test('Klarna Success', async t => {
        await doKlarnaPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaRedirectWithIDNumber(true);
        await checkoutPage.expectSuccess();
    });
}
