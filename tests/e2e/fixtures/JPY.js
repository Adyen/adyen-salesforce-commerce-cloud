import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import { doKonbiniPayment } from "../paymentFlows/pending";
const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`JPY`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.JP}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
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



