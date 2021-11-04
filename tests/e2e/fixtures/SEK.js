import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import {doQRCodePayment} from "../paymentFlows/pending";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`SEK`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.SE}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
    })
    .beforeEach( async t => {
      await t.maximizeWindow()
      checkoutPage = new CheckoutPage();
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.SE);
      await checkoutPage.setShopperDetails(shopperData.SE);
    });

test.skip('Swish Success', async t => {
    await doQRCodePayment("swish");
    await checkoutPage.expectQRcode();
});
