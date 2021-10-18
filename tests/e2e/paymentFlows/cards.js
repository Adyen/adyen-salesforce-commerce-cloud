import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doCardPayment = async (cardData) => {
  await paymentMethodsPage.initiateCardPayment(cardData);
  await checkoutPage.completeCheckout();
}

const do3Ds1Verification = async () => {
  await paymentMethodsPage.do3Ds1Verification();
}

const do3Ds2Verification = async () => {
  await paymentMethodsPage.do3Ds2Verification();
}

module.exports = {
  doCardPayment,
  do3Ds1Verification,
  do3Ds2Verification,
}
