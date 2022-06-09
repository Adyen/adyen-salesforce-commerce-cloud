import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
const paymentMethodsPage = new PaymentMethodsPage();

export const doIdealPayment = async (testSuccess) => {
  await paymentMethodsPage.initiateIdealPayment(testSuccess);
};

export const completeIdealRedirect = async () => {
  await paymentMethodsPage.submitSimulator();
};

export const doBillDeskPayment = async (paymentMethod) => {
  await paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
};

export const completeBillDeskRedirect = async (success) => {
  await paymentMethodsPage.billdeskSimulator(success);
};

export const doOneyPayment = async (shopper) => {
  await paymentMethodsPage.initiateOneyPayment(shopper);
};

export const completeOneyRedirect = async (shopper) => {
  await paymentMethodsPage.confirmOneyPayment();
};

export const doKlarnaPayment = async () => {
  await paymentMethodsPage.initiateKlarnaPayment(null);
};

export const completeKlarnaRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmKlarnaPayment();
  } else {
    await paymentMethodsPage.cancelKlarnaPayment();
  }
};

export const completeKlarnaRedirectWithIDNumber = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmKlarnaPaymentWithIDNumber();
  } else {
    await paymentMethodsPage.cancelKlarnaPayment();
  }
};

export const doKlarnaPayNowPayment = async () => {
  await paymentMethodsPage.initiateKlarnaPayment('paynow');
};

export const completeKlarnaPayNowRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmKlarnaPayNowPayment();
  } else {
    await paymentMethodsPage.cancelKlarnaPayment();
  }
};

export const doKlarnaAccountPayment = async () => {
  await paymentMethodsPage.initiateKlarnaPayment('account');
};

export const completeKlarnaAccountRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmKlarnaAccountPayment();
  } else {
    await paymentMethodsPage.cancelKlarnaPayment();
  }
};

export const doGiropayPayment = async (page) => {
  await page.click('#rb_giropay');
};

export const completeGiropayRedirect = async (paymentData, success) => {
  if (success) {
    await paymentMethodsPage.confirmGiropayPayment(paymentData);
  } else {
    await paymentMethodsPage.cancelGiropayPayment();
  }
};

export const doEPSPayment = async () => {
  await paymentMethodsPage.initiateEPSPayment(success);
};

export const completeEPSRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmSimulator();
  } else {
    await paymentMethodsPage.cancelSimulator();
  }
};

export const doAffirmPayment = async (shopper) => {
  await paymentMethodsPage.initiateAffirmPayment(shopper);
};

export const completeAffirmRedirect = async () => {
  await paymentMethodsPage.cancelAffirmPayment();
};

export const doVippsPayment = async (page) => {
  await page.click('#rb_vipps');
};

export const completeVippsRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmVippsPayment();
  } else {
    await paymentMethodsPage.cancelVippsPayment();
  }
};

export const doTrustlyPayment = async (page) => {
  await page.click('#rb_trustly');
};

export const completeTrustlyRedirect = async (success) => {
  if (success) {
    await paymentMethodsPage.confirmTrustlyPayment();
  } else {
    await paymentMethodsPage.cancelTrustlyPayment();
  }
};

export const doMobilePayPayment = async (page) => {
  await page.click('#rb_mobilepay');
};

export const completeMobilePayRedirect = async () => {
  await paymentMethodsPage.confirmMobilePayPayment();
};
