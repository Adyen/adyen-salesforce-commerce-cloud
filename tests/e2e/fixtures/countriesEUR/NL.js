import CheckoutPage from "../../pages/CheckoutPage";
import { doIdealPayment } from "../../paymentFlows/redirectShopper"
const shopperData = require("../../shopperData.json");
module.exports = () => {
    //TODO use beforeEach to fill cart and set shopper details
    test('iDeal Success', async t => {
        //Step 1: creating full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        //TODO map currency and locale with Enum
        await checkoutPage.goToCheckoutPageWithFullCart('fr_FR');

        //Step 2: Create user from specific country
        await checkoutPage.setShopperDetails(shopperData.NL);

        //Step 3: initiate the payment method test
        await doIdealPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('iDeal Fail', async t => {
        //Step 1: creating full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        //TODO map currency and locale with Enum
        await checkoutPage.goToCheckoutPageWithFullCart('fr_FR');

        //Step 2: Create user from specific country
        await checkoutPage.setShopperDetails(shopperData.NL);

        //Step 3: initiate the payment method test
        await doIdealPayment(false);
        await checkoutPage.expectRefusal();
    });
}


