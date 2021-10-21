import { regionsEnum } from "../data/enums";
import { doAffirmPayment } from "../paymentFlows/redirectShopper";

fixture`USD`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home?lang=${regionsEnum.US}`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test('Affirm Success', async t => {
    await doAffirmPayment(true);
    await checkoutPage.expectSuccess();
});

test('Affirm Fail', async t => {
    await doAffirmPayment(false);
    await checkoutPage.expectRefusal();
});
