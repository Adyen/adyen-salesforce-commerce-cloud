import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doIdealPayment = async (testSuccess) => {
    await paymentMethodsPage.initiateIdealPayment(testSuccess);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.submitSimulator();
}

const doBillDeskPayment = async (paymentMethod, result) => {
    await paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.billdeskSimulator(result);
}

module.exports = {
    doIdealPayment,
    doBillDeskPayment,
}
