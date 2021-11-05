import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doMBWayPayment = async () => {
    await checkoutPage.setEmail();
    await paymentMethodsPage.initiateMBWayPayment();
}

const doSEPAPayment = async () => {
    await paymentMethodsPage.initiateSEPAPayment();
    await checkoutPage.completeCheckout();
}

const doBankTransferPayment = async () => {
    await paymentMethodsPage.initiateBankTransferPayment();
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.submitSimulator();
}

const doQRCodePayment = async (paymentMethod) => {
    await checkoutPage.setEmail();
    await paymentMethodsPage.initiateQRCode(paymentMethod);
}

const doGooglePayPayment = async () => {
    await checkoutPage.setEmail();
    await paymentMethodsPage.initiateGooglePayPayment();
}

const doKonbiniPayment = async () => {
    await paymentMethodsPage.initiateKonbiniPayment();
    await checkoutPage.completeCheckout();
}

module.exports = {
    doMBWayPayment,
    doSEPAPayment,
    doBankTransferPayment,
    doQRCodePayment,
    doGooglePayPayment,
    doKonbiniPayment,
}