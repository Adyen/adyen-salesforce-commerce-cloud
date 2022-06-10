import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
export class Cards {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new PaymentMethodsPage(page);
  }

  doCardPayment = async (cardData) => {
    await paymentMethodsPage.initiateCardPayment(cardData);
  };

  do3Ds1Verification = async () => {
    await paymentMethodsPage.do3Ds1Verification();
  };

  do3Ds2Verification = async () => {
    await paymentMethodsPage.do3Ds2Verification();
  };

  doCardPaymentOneclick = async (cardData) => {
    const oneClickLabel = `************${cardData.cardNumber.substring(
      cardData.cardNumber.length - 4,
    )}`;
    await paymentMethodsPage.initiateOneClickPayment({
      oneClickLabel,
      cvc: cardData.cvc,
    });
  };

  doCardPaymentInstallments = async (cardData, nrInstallments) => {
    await paymentMethodsPage.initiateCardPayment(cardData);
    await paymentMethodsPage.selectInstallments(nrInstallments);
  };
}
