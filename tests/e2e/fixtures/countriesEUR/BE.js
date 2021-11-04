import CheckoutPage from "../../pages/CheckoutPage";
import { doQRCodePayment } from "../../paymentFlows/pending"
import { regionsEnum } from "../../data/enums";

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    test('bcmc mobile renders', async t => {
        //Step 1: creating full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        //TODO map currency and locale with Enum
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        //Step 2: Create user from specific country
        await checkoutPage.setShopperDetails(shopperData.BE);

        //Step 3: initiate the payment method test
        await doQRCodePayment("bcmc_mobile");
        await checkoutPage.expectQRcode();
    });
}


