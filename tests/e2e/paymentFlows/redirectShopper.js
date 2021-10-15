import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doIdealPayment = async (testSuccess) => {
    await paymentMethodsPage.initiateIdealPayment(testSuccess);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.submitIdealSimulator();
}

module.exports = {
    doIdealPayment,
}
