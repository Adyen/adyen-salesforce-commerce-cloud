import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doMultiBancoPayment = async () => {
    await paymentMethodsPage.initiateMultiBancoPayment();
    await checkoutPage.completeCheckout();
    return await paymentMethodsPage.MultiBancoVoucherExists();
}

const doBoletoPayment = async () => {
    await paymentMethodsPage.initiateBoletoPayment();
    await checkoutPage.completeCheckout();
}

module.exports = {
    doMultiBancoPayment,
    doBoletoPayment,
}