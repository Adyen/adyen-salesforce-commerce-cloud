import CheckoutPage from "../../pages/CheckoutPage";
import { doIdealPayment } from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    test('iDeal Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.setShopperDetails(shopperData.NL);

        await doIdealPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('iDeal Fail', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.setShopperDetails(shopperData.NL);

        await doIdealPayment(false);
        await checkoutPage.expectRefusal();
    });
}


