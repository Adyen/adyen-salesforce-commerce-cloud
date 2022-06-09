import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
const paymentMethodsPage = new PaymentMethodsPage(page);

const doMultiBancoPayment = async () => {
  await paymentMethodsPage.initiateMultiBancoPayment();
  return await paymentMethodsPage.MultiBancoVoucherExists();
};

const doBoletoPayment = async () => {
  await paymentMethodsPage.initiateBoletoPayment();
};

module.exports = {
  doMultiBancoPayment,
  doBoletoPayment,
};
