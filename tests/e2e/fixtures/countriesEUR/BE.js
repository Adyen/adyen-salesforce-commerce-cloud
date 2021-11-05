import CheckoutPage from "../../pages/CheckoutPage";
import { doQRCodePayment } from "../../paymentFlows/pending"
import { regionsEnum } from "../../data/enums";

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    test('bcmc mobile renders', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.setShopperDetails(shopperData.BE);

        await doQRCodePayment("bcmc_mobile");
        await checkoutPage.expectQRcode();
    });
}


