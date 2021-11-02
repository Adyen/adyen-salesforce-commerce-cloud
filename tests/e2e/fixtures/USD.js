import { regionsEnum } from "../data/enums";
import { doAffirmPayment } from "../paymentFlows/redirectShopper";
import CheckoutPage from "../pages/CheckoutPage";

const shopperData = require("../data/shopperData.json");

fixture`USD`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
    // create full cart and go to checkout
    const checkoutPage = new CheckoutPage();
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.US);
    await checkoutPage.setShopperDetails(shopperData.US);
    });

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test('Affirm Success', async t => {
    await doAffirmPayment(shopperData.US, true);
    await checkoutPage.expectSuccess();
});

test('Affirm Fail', async t => {
    await doAffirmPayment(shopperData.US,false);
    await checkoutPage.expectRefusal();
});
