import CheckoutPage from "../../pages/CheckoutPage";
import { doMultiBancoPayment } from "../../paymentFlows/presentToShopper";
import { doMBWayPayment } from "../../paymentFlows/pending"
import { regionsEnum } from "../../data/enums";

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    test('MultiBanco Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        await checkoutPage.setShopperDetails(shopperData.PT);

        const voucher = await doMultiBancoPayment();
        await t.expect(voucher).ok();
    });

    test.skip('MBWay Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        await checkoutPage.setShopperDetails(shopperData.PT);

        await doMBWayPayment();
        await checkoutPage.expectSuccess();
    });
}


