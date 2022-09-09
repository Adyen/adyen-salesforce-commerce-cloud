import { doMultiBancoPayment } from "../../paymentFlows/presentToShopper";
import { doMBWayPayment } from "../../paymentFlows/pending"

const shopperData = require("../../data/shopperData.json");
module.exports = (checkoutPage) => {
    test('MultiBanco Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.PT);
        await doMultiBancoPayment();
        await checkoutPage.completeCheckout();
        await checkoutPage.expectSuccess();
        await checkoutPage.expectVoucher();
    });

    test.skip('MBWay Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.PT);
        await checkoutPage.setEmail();
        await doMBWayPayment();
        await checkoutPage.completeCheckout();
        await checkoutPage.expectSuccess();
    });
}


