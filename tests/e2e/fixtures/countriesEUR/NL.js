import { doIdealPayment, completeIdealRedirect } from "../../paymentFlows/redirectShopper";
import { doSEPAPayment, doBankTransferPayment, completeBankTransferRedirect, doGooglePayPayment } from "../../paymentFlows/pending";
const shopperData = require("../../data/shopperData.json");

module.exports = (checkoutPage) => {
    test('iDeal Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.NL);
        await doIdealPayment(true);
        await checkoutPage.completeCheckout();
        await completeIdealRedirect();
        await checkoutPage.expectSuccess();
    });

    test('iDeal Fail', async () => {
        await checkoutPage.setShopperDetails(shopperData.NL);
        await doIdealPayment(false);
        await checkoutPage.completeCheckout();
        await completeIdealRedirect();
        await checkoutPage.expectRefusal();
    });

    test('SEPA Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.NL);
        await doSEPAPayment();
        await checkoutPage.completeCheckout();
        await checkoutPage.expectSuccess();
    });

    test('bankTransfer_IBAN Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.NL);
        await doBankTransferPayment();
        await checkoutPage.completeCheckout();
        await completeBankTransferRedirect();
        await checkoutPage.expectSuccess();
    });

    test.skip('Google Pay Success', async () => {
        await checkoutPage.setShopperDetails(shopperData.NL);
        await checkoutPage.setEmail();
        await doGooglePayPayment();
    });
}


