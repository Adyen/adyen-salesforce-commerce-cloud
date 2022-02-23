import { regionsEnum } from "../data/enums";
import { environments } from "../data/environments";
import {
    doBillDeskPayment,
    completeBillDeskRedirect,
} from "../paymentFlows/redirectShopper";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

for(const environment of environments) {
    fixture`${environment.name} INR`
        .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
        .httpAuth({
            username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
            password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
        })
        .beforeEach(async t => {
            await t.maximizeWindow()
            checkoutPage = new environment.CheckoutPage();
            await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.IN);
            await checkoutPage.setShopperDetails(shopperData.IN);
        });

    test('UPI Success', async t => {
        await doBillDeskPayment("billdesk_upi");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('UPI Failure', async t => {
        await doBillDeskPayment("billdesk_upi");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(false);
        await checkoutPage.expectRefusal();
    });

    test('Wallet Success', async t => {
        await doBillDeskPayment("billdesk_wallet");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('Wallet Failure', async t => {
        await doBillDeskPayment("billdesk_wallet");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(false);
        await checkoutPage.expectRefusal();
    });

    test('Billdesk Online Success', async t => {
        await doBillDeskPayment("billdesk_online");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('Billdesk Online Failure', async t => {
        await doBillDeskPayment("billdesk_online");
        await checkoutPage.completeCheckout();
        await completeBillDeskRedirect(false);
        await checkoutPage.expectRefusal();
    });
}


