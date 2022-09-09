import PaymentMethodsPage from "../pages/PaymentMethodsPage";
const paymentMethodsPage = new PaymentMethodsPage();

const doMultiBancoPayment = async () => {
    await paymentMethodsPage.initiateMultiBancoPayment();
    return await paymentMethodsPage.MultiBancoVoucherExists();
}

const doBoletoPayment = async () => {
    await paymentMethodsPage.initiateBoletoPayment();
}

module.exports = {
    doMultiBancoPayment,
    doBoletoPayment,
}
