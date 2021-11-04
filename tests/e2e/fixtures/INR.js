import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import { doBillDeskPayment } from "../paymentFlows/redirectShopper";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`INR`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
        await t.maximizeWindow()
        checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.IN);
        await checkoutPage.setShopperDetails(shopperData.IN);
    });

test('UPI Success', async t => {
    await doBillDeskPayment("billdesk_upi", "Success");
    await checkoutPage.expectSuccess();
});

test('UPI Failure', async t => {
    await doBillDeskPayment("billdesk_upi", "Failure");
    await checkoutPage.expectRefusal();
});

test.only('Wallet Success', async t => {
    await doBillDeskPayment("billdesk_wallet", "Success");
    await checkoutPage.expectSuccess();
});

test('Wallet Failure', async t => {
    await doBillDeskPayment("billdesk_wallet", "Failure");
    await checkoutPage.expectRefusal();
});

test('Billdesk Online Success', async t => {
    await doBillDeskPayment("billdesk_online", "Success");
    await checkoutPage.expectSuccess();
});

test.only('Billdesk Online Failure', async t => {
    await doBillDeskPayment("billdesk_online", "Failure");
    await checkoutPage.expectRefusal();
});


