import CheckoutPage from "../../pages/CheckoutPage";
import { doIdealPayment } from "../../paymentFlows/redirectShopper";
import { doSEPAPayment, doBankTransferPayment, doGooglePayPayment } from "../../paymentFlows/pending";
import { regionsEnum } from "../../data/enums";

const shopperData = require("../../data/shopperData.json");
module.exports = () => {
    test('iDeal Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.setShopperDetails(shopperData.NL);

        await doIdealPayment(true);
        await checkoutPage.expectSuccess();
    });

    test('iDeal Fail', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.setShopperDetails(shopperData.NL);

        await doIdealPayment(false);
        await checkoutPage.expectRefusal();
    });

    test('SEPA Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        await checkoutPage.setShopperDetails(shopperData.NL);

        await doSEPAPayment();
        await checkoutPage.expectSuccess();
    });

    test('bankTransfer_IBAN Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        await checkoutPage.setShopperDetails(shopperData.NL);

        await doBankTransferPayment();
        await checkoutPage.expectSuccess();
    });

    test.skip('Google Pay Success', async t => {
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

        await checkoutPage.setShopperDetails(shopperData.NL);

        await doGooglePayPayment();
    });
}


