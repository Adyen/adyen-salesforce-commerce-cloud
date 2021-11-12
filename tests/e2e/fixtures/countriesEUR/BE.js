import { doQRCodePayment } from "../../paymentFlows/pending"

const shopperData = require("../../data/shopperData.json");
module.exports = (checkoutPage) => {
    test('bcmc mobile renders', async t => {
        await checkoutPage.setShopperDetails(shopperData.BE);
        await doQRCodePayment("bcmc_mobile");
        await checkoutPage.expectQRcode();
    });
}


