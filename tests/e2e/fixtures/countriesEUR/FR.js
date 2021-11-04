import CheckoutPage from "../../pages/CheckoutPage";
import { doOneyPayment } from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
const checkoutPage = new CheckoutPage();
module.exports = () => {
    test.skip('Oney Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.FR);
        await doOneyPayment(shopperData.FR);
        await checkoutPage.expectSuccess();
    });

    test.skip('Oney Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.FR);
        await doOneyPayment(false);
        await checkoutPage.expectRefusal();
    });
}


