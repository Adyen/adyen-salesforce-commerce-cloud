import CheckoutPage from "../../pages/CheckoutPage";
import { doEPSPayment } from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
const checkoutPage = new CheckoutPage();
module.exports = () => {
    test('EPS Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.AT);
        await doEPSPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('EPS Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.AT);
        await doEPSPayment(false);
        await checkoutPage.expectRefusal();
    });
}


