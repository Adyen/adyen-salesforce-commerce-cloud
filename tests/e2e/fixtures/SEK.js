import CheckoutPage from "../pages/CheckoutPage";
import {regionsEnum} from "../data/enums";

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
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.DK);
      await checkoutPage.setShopperDetails(shopperData.DK);
    });

test('Swish', async () => {

});



