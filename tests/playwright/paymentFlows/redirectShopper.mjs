import paymentMethodsPage from '../pages/paymentMethodsPage.mjs';
export class RedirectShopper {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new paymentMethodsPage(page);
  }

  doIdealPayment = async (testSuccess) => {
    await this.paymentMethodsPage.initiateIdealPayment(testSuccess);
  };

  completeIdealRedirect = async () => {
    await this.paymentMethodsPage.submitSimulator();
  };

  doBillDeskPayment = async (paymentMethod) => {
    await this.paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
  };

  completeBillDeskRedirect = async (success) => {
    await this.paymentMethodsPage.billdeskSimulator(success);
  };

  doOneyPayment = async (shopper) => {
    await this.paymentMethodsPage.initiateOneyPayment(shopper);
  };

  completeOneyRedirect = async (shopper) => {
    await this.paymentMethodsPage.confirmOneyPayment();
  };

  doKlarnaPayment = async () => {
    await this.paymentMethodsPage.initiateKlarnaPayment(null);
  };

  completeKlarnaRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmKlarnaPayment();
    } else {
      await this.paymentMethodsPage.cancelKlarnaPayment();
    }
  };

  completeKlarnaRedirectWithIDNumber = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmKlarnaPaymentWithIDNumber();
    } else {
      await this.paymentMethodsPage.cancelKlarnaPayment();
    }
  };

  doKlarnaPayNowPayment = async () => {
    await this.paymentMethodsPage.initiateKlarnaPayment('paynow');
  };

  completeKlarnaPayNowRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmKlarnaPayNowPayment();
    } else {
      await this.paymentMethodsPage.cancelKlarnaPayment();
    }
  };

  doKlarnaAccountPayment = async () => {
    await this.paymentMethodsPage.initiateKlarnaPayment('account');
  };

  completeKlarnaAccountRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmKlarnaAccountPayment();
    } else {
      await this.paymentMethodsPage.cancelKlarnaPayment();
    }
  };

  doGiropayPayment = async (page) => {
    await page.click('#rb_giropay');
  };

  completeGiropayRedirect = async (paymentData, success) => {
    if (success) {
      await this.paymentMethodsPage.confirmGiropayPayment(paymentData);
    } else {
      await this.paymentMethodsPage.cancelGiropayPayment();
    }
  };

  doEPSPayment = async () => {
    await this.paymentMethodsPage.initiateEPSPayment(success);
  };

  completeEPSRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmSimulator();
    } else {
      await this.paymentMethodsPage.cancelSimulator();
    }
  };

  doAffirmPayment = async (shopper) => {
    await this.paymentMethodsPage.initiateAffirmPayment(shopper);
  };

  completeAffirmRedirect = async () => {
    await this.paymentMethodsPage.cancelAffirmPayment();
  };

  doVippsPayment = async (page) => {
    await page.click('#rb_vipps');
  };

  completeVippsRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmVippsPayment();
    } else {
      await this.paymentMethodsPage.cancelVippsPayment();
    }
  };

  doTrustlyPayment = async (page) => {
    await page.click('#rb_trustly');
  };

  completeTrustlyRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmTrustlyPayment();
    } else {
      await this.paymentMethodsPage.cancelTrustlyPayment();
    }
  };

  doMobilePayPayment = async (page) => {
    await page.click('#rb_mobilepay');
  };

  completeMobilePayRedirect = async () => {
    await this.paymentMethodsPage.confirmMobilePayPayment();
  };
}
