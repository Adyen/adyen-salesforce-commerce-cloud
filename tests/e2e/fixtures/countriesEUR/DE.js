import CheckoutPage from "../../pages/CheckoutPage";
import { doKlarnaAccountPayment, doKlarnaPayment, doKlarnaPayNowPayment, doGiropayPayment } from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
const paymentData = require("../../data/paymentData.json");

const checkoutPage = new CheckoutPage();
module.exports = () => {
    test('Klarna Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment(false);
        await checkoutPage.expectRefusal();
    });
    test('Klarna Pay now Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Pay now Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment(false);
        await checkoutPage.expectRefusal();
    });
    test('Klarna Account Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Account Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment(false);
        await checkoutPage.expectRefusal();
    });
    test.only('Giropay Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment(paymentData.GiroPay, true);
        await checkoutPage.expectSuccess();
    });

    test('Giropay Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment(false);
        await checkoutPage.expectRefusal();
    });
}


