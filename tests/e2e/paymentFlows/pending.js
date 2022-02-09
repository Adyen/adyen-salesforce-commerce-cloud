import PaymentMethodsPage from "../pages/PaymentMethodsPage";
const paymentMethodsPage = new PaymentMethodsPage();

const doMBWayPayment = async () => {
    await paymentMethodsPage.initiateMBWayPayment();
}

const doSEPAPayment = async () => {
    await paymentMethodsPage.initiateSEPAPayment();
}

const doBankTransferPayment = async () => {
    await paymentMethodsPage.initiateBankTransferPayment();
}

const completeBankTransferRedirect = async () => {
    await paymentMethodsPage.submitSimulator();
}

const doQRCodePayment = async (paymentMethod, envName) => {
    await paymentMethodsPage.initiateQRCode(paymentMethod, envName);
}

const doGooglePayPayment = async () => {
    await paymentMethodsPage.initiateGooglePayPayment();
}

const doKonbiniPayment = async () => {
    await paymentMethodsPage.initiateKonbiniPayment();
}

module.exports = {
    doMBWayPayment,
    doSEPAPayment,
    doBankTransferPayment,
    completeBankTransferRedirect,
    doQRCodePayment,
    doGooglePayPayment,
    doKonbiniPayment,
}
