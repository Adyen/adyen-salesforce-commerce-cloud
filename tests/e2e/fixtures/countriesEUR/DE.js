import {
    doKlarnaAccountPayment,
    completeKlarnaAccountRedirect,
    doKlarnaPayment,
    completeKlarnaRedirect,
    doKlarnaPayNowPayment,
    completeKlarnaPayNowRedirect,
    doGiropayPayment,
    completeGiropayRedirect,
} from "../../paymentFlows/redirectShopper"

const shopperData = require("../../data/shopperData.json");
const paymentData = require("../../data/paymentData.json");

module.exports = (checkoutPage) => {
    test('Klarna Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaRedirect(false);
        await checkoutPage.expectRefusal();
    });
    test('Klarna Pay now Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaPayNowRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Pay now Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaPayNowPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaPayNowRedirect(false);
        await checkoutPage.expectRefusal();
    });
    test('Klarna Account Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaAccountRedirect(true);
        await checkoutPage.expectSuccess();
    });

    test('Klarna Account Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doKlarnaAccountPayment();
        await checkoutPage.completeCheckout();
        await completeKlarnaAccountRedirect(false);
        await checkoutPage.expectRefusal();
    });
    test('Giropay Success', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment();
        await checkoutPage.completeCheckout();
        await completeGiropayRedirect(paymentData.GiroPay,true);
        await checkoutPage.expectSuccess();
    });

    test('Giropay Fail', async t => {
        await checkoutPage.setShopperDetails(shopperData.DE);
        await doGiropayPayment();
        await checkoutPage.completeCheckout();
        await completeGiropayRedirect(paymentData.GiroPay,false);
        await checkoutPage.expectRefusal();
    });
}


