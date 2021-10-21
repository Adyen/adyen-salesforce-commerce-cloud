import CheckoutPage from "../../pages/CheckoutPage";
import { doKlarnaAccountPayment, doKlarnaPayment, doKlarnaPayNowPayment, doGiropayPayment } from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
const checkoutPage = new CheckoutPage();
module.exports = () => {
    test.only('Klarna Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment(true);
        await checkoutPage.expectSuccess();
    });

    test.only('Klarna Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment(false);
        await checkoutPage.expectRefusal();
    });
    test.only('Klarna Pay now Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment(true);
        await checkoutPage.expectSuccess();
    });

    test.only('Klarna Pay now Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment(false);
        await checkoutPage.expectRefusal();
    });
    test.only('Klarna Account Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment(true);
        await checkoutPage.expectSuccess();
    });

    test.only('Klarna Account Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment(false);
        await checkoutPage.expectRefusal();
    });
    test.only('Giropay Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment(true);
        await checkoutPage.expectSuccess();
    });

    test.only('Giropay Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment(false);
        await checkoutPage.expectRefusal();
    });
}


