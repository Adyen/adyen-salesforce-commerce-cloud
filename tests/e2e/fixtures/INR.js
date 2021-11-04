import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import {doQRCodePayment} from "../paymentFlows/pending";
import {doIdealPayment, doBillDeskPayment} from "../paymentFlows/redirectShopper";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`INR`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.IN}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
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


