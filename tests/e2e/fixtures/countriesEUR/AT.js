import { doEPSPayment, completeEPSRedirect } from "../../paymentFlows/redirectShopper"
const shopperData = require("../../data/shopperData.json");

module.exports = (checkoutPage) => {
    test.skip('EPS Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.AT);
        await doEPSPayment();
        await checkoutPage.completeCheckout();
        await completeEPSRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test.skip('EPS Fail', async () => {
        await checkoutPage.setShopperDetails(shopperData.AT);
        await doEPSPayment();
        await checkoutPage.completeCheckout();
        await completeEPSRedirect(false);
        await checkoutPage.expectRefusal();
    });
}


