import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import {doQRCodePayment} from "../paymentFlows/pending";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`SEK`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
      await t.maximizeWindow()
      checkoutPage = new CheckoutPage();
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.SE);
      await checkoutPage.setShopperDetails(shopperData.SE);
    });

test.skip('Swish success', async () => {
    await doQRCodePayment("swish");
    await checkoutPage.expectQRcode();
});


