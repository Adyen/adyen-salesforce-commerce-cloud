import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
export class PendingPayments {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new PaymentMethodsPage(page);
  }

  doMBWayPayment = async () => {
    await this.paymentMethodsPage.initiateMBWayPayment();
  };

  doSEPAPayment = async () => {
    await this.paymentMethodsPage.initiateSEPAPayment();
  };

  doBankTransferPayment = async () => {
    await this.paymentMethodsPage.initiateBankTransferPayment();
  };

  completeBankTransferRedirect = async () => {
    await this.paymentMethodsPage.submitBankSimulator();
  };

  doQRCodePayment = async (paymentMethod, envName) => {
    await this.paymentMethodsPage.initiateQRCode(paymentMethod, envName);
  };

  doGooglePayPayment = async () => {
    await this.paymentMethodsPage.initiateGooglePayPayment();
  };

  doKonbiniPayment = async () => {
    await this.paymentMethodsPage.initiateKonbiniPayment();
  };
}
