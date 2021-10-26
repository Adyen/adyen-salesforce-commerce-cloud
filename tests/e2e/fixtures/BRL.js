import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import shopperData from "../data/shopperData.json";
import {doBoletoPayment} from "../paymentFlows/presentToShopper";

fixture`BRL`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.BR}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
    });

test
    .disablePageCaching
    ('Boleto Success', async t => {
    const checkoutPage = new CheckoutPage();
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.BR);

    await checkoutPage.setShopperDetails(shopperData.BR);

    await doBoletoPayment();
    await checkoutPage.expectVoucher();
});

test('Boleto Fail', async t => {

});
