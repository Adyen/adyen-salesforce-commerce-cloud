import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
export class PresentToShoppers {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new PaymentMethodsPage(page);
  }

  doMultiBancoPayment = async () => {
    await this.paymentMethodsPage.initiateMultiBancoPayment();
  };

  doBoletoPayment = async () => {
    await this.paymentMethodsPage.initiateBoletoPayment();
  };
}
