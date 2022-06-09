import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
const paymentMethodsPage = new PaymentMethodsPage();

export const doMBWayPayment = async () => {
  await paymentMethodsPage.initiateMBWayPayment();
};

export const doSEPAPayment = async () => {
  await paymentMethodsPage.initiateSEPAPayment();
};

export const doBankTransferPayment = async () => {
  await paymentMethodsPage.initiateBankTransferPayment();
};

export const completeBankTransferRedirect = async () => {
  await paymentMethodsPage.submitSimulator();
};

export const doQRCodePayment = async (paymentMethod, envName) => {
  await paymentMethodsPage.initiateQRCode(paymentMethod, envName);
};

export const doGooglePayPayment = async () => {
  await paymentMethodsPage.initiateGooglePayPayment();
};

export const doKonbiniPayment = async () => {
  await paymentMethodsPage.initiateKonbiniPayment();
};
