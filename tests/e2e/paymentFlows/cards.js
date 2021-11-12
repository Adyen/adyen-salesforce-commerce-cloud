import PaymentMethodsPage from "../pages/PaymentMethodsPage";
const paymentMethodsPage = new PaymentMethodsPage();

const doCardPayment = async (cardData) => {
  await paymentMethodsPage.initiateCardPayment(cardData);
}

const do3Ds1Verification = async () => {
  await paymentMethodsPage.do3Ds1Verification();
}

const do3Ds2Verification = async () => {
  await paymentMethodsPage.do3Ds2Verification();
}

const doCardPaymentOneclick = async (cardData) => {
  const oneClickLabel = `************${cardData.cardNumber.substring(cardData.cardNumber.length - 4)}`;
  await paymentMethodsPage.initiateOneClickPayment({
    oneClickLabel,
    cvc: cardData.cvc,
  });
}

const doCardPaymentInstallments = async (cardData, nrInstallments) => {
  await paymentMethodsPage.initiateCardPayment(cardData);
  await paymentMethodsPage.selectInstallments(nrInstallments);
}

module.exports = {
  doCardPayment,
  do3Ds1Verification,
  do3Ds2Verification,
  doCardPaymentOneclick,
  doCardPaymentInstallments,
}
