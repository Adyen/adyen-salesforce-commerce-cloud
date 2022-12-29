import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
export class Cards {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new PaymentMethodsPage(page);
  }

  doCardPayment = async (cardData) => {
    await this.paymentMethodsPage.initiateCardPayment(cardData);
  };

  doGiftCardPayment = async (cardData) => {
    await this.paymentMethodsPage.initiateGiftCardPayment(cardData);
  };

  do3Ds1Verification = async () => {
    await this.paymentMethodsPage.do3Ds1Verification();
  };

  do3Ds2Verification = async () => {
    await this.paymentMethodsPage.do3Ds2Verification();
  };

  doCardPaymentOneclick = async (cardData) => {
    const oneClickLabel = `************${cardData.cardNumber.substring(
      cardData.cardNumber.length - 4,
    )}`;
    await this.paymentMethodsPage.initiateOneClickPayment({
      oneClickLabel,
      cvc: cardData.cvc,
    });
  };

  doCardPaymentInstallments = async (cardData, nrInstallments) => {
    await this.paymentMethodsPage.initiateCardPayment(cardData);
    await this.paymentMethodsPage.selectInstallments(nrInstallments);
  };
}
