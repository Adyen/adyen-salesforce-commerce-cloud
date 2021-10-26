import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doMBWayPayment = async () => {
    await checkoutPage.setEmail();
    await paymentMethodsPage.initiateMBWayPayment();
}

module.exports = {
    doMBWayPayment,
}