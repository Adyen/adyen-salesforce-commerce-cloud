import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
const paymentMethodsPage = new PaymentMethodsPage(page);

export const doMultiBancoPayment = async () => {
  await paymentMethodsPage.initiateMultiBancoPayment();
  return await paymentMethodsPage.MultiBancoVoucherExists();
};

export const doBoletoPayment = async () => {
  await paymentMethodsPage.initiateBoletoPayment();
};
