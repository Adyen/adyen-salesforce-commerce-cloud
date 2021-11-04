import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import { doKonbiniPayment } from "../paymentFlows/pending";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`JPY`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
        await t.maximizeWindow()
        checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.JP);
        await checkoutPage.setShopperDetails(shopperData.JP);
    });

test('konbini Success', async t => {
    await doKonbiniPayment();
    await checkoutPage.expectSuccess();
});



