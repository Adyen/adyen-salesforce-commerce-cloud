import CheckoutPage from "../../pages/CheckoutPage";
import { doMultiBancoPayment } from "../../paymentFlows/presentToShopper";
import { doMBWayPayment } from "../../paymentFlows/pending"
import { regionsEnum } from "../../data/enums";

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    //TODO use beforeEach to fill cart and set shopper details
    test('MultiBanco Success', async t => {
        //Step 1: creating full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        //TODO map currency and locale with Enum
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        //Step 2: Create user from specific country
        await checkoutPage.setShopperDetails(shopperData.PT);

        //Step 3: initiate the payment method test
        const voucher = await doMultiBancoPayment();
        await t.expect(voucher).ok();
    });

    test('MBWay Success', async t => {
        //Step 1: creating full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        //TODO map currency and locale with Enum
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        //Step 2: Create user from specific country
        await checkoutPage.setShopperDetails(shopperData.PT);

        //Step 3: initiate the payment method test
        await doMBWayPayment();
        await t.wait(30000); //TODO deal with this wait
        await checkoutPage.expectSuccess();
    });
}


