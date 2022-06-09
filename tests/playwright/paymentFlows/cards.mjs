import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
const paymentMethodsPage = new PaymentMethodsPage();

export const doCardPayment = async (cardData) => {
  await paymentMethodsPage.initiateCardPayment(cardData);
};

export const do3Ds1Verification = async () => {
  await paymentMethodsPage.do3Ds1Verification();
};

export const do3Ds2Verification = async () => {
  await paymentMethodsPage.do3Ds2Verification();
};

export const doCardPaymentOneclick = async (cardData) => {
  const oneClickLabel = `************${cardData.cardNumber.substring(
    cardData.cardNumber.length - 4,
  )}`;
  await paymentMethodsPage.initiateOneClickPayment({
    oneClickLabel,
    cvc: cardData.cvc,
  });
};

export const doCardPaymentInstallments = async (cardData, nrInstallments) => {
  await paymentMethodsPage.initiateCardPayment(cardData);
  await paymentMethodsPage.selectInstallments(nrInstallments);
};
