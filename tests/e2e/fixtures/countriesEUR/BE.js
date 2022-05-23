import { doQRCodePayment } from "../../paymentFlows/pending"

const shopperData = require("../../data/shopperData.json");
module.exports = (checkoutPage, environment) => {
    test('bcmc mobile renders', async t => {
        await checkoutPage.setShopperDetails(shopperData.BE);
        if(environment.name === "SG")
            await checkoutPage.setEmail();
        await doQRCodePayment("bcmc_mobile", environment.name);
        if(environment.name === "SFRA")
            await checkoutPage.completeCheckout();
        await checkoutPage.expectQRcode();
    });
}


