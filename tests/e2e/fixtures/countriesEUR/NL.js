import Checkout from "../../pages/checkout";
import { ideal } from "../../pages/paymentFlows/redirectShopper"
import { shopperNL } from "../../shopperData";

module.exports = () => {
    test('iDeal Success', async t => {
        //Step 1: creating full cart and go to checkout
        //Go to specific storefront URL for locale/currency
        //TODO extract this step to add product to cart
        const checkout = new Checkout();
        await checkout.goToCheckoutPageWithFullCart();
        await checkout.checkoutAsGuest();

        //Step 2: Create user from specific country
        //TODO map only NL shopper data from JSON
        await checkout.setShopperDetails(shopperNL);
        await checkout.goToPaymentsPage();

        //Step 3: initiate the payment method test
        //TODO add issuer into arguments
        await ideal();
        await checkout.expectSuccess();
    });

    test('iDeal Fail', async t => {

    });
}


