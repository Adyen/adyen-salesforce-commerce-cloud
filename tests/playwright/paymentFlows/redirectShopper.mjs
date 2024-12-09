import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';
export class RedirectShopper {
  constructor(page) {
    this.page = page;
    this.paymentMethodsPage = new PaymentMethodsPage(page);
  }

  doIdealPayment = async () => {
    await this.paymentMethodsPage.initiateIdealPayment();
  };

  completeIdealRedirect = async (testSuccess) => {
    await this.paymentMethodsPage.submitSimulator(testSuccess);
  };

  doBillDeskPayment = async (paymentMethod) => {
    await this.paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
  };

  doUPIPayment = async (paymentMethod, success) => {
    await this.paymentMethodsPage.initiateUPIPayment(paymentMethod, success);
  }

  completeBillDeskRedirect = async (success) => {
    await this.paymentMethodsPage.billdeskSimulator(success);
  };

  doOneyPayment = async (shopper) => {
    await this.paymentMethodsPage.initiateOneyPayment(shopper);
  };

  doPayPalPayment = async (expressFlow, shippingChange, success, taxation) => {
    await this.paymentMethodsPage.initiatePayPalPayment(expressFlow, shippingChange, success, taxation);
  };

  doGooglePayExpressPayment = async () => {
    await this.paymentMethodsPage.initiateGooglePayExpressPayment();
  };

  doAmazonPayment = async (normalFlow, selectedCard, success) => {
    await this.paymentMethodsPage.initiateAmazonPayment(normalFlow, selectedCard, success);
  }

  doAmazonExpressPayment = async () => {
    await this.paymentMethodsPage.continueAmazonExpressFlow();
  };

  completeOneyRedirect = async (shopper) => {
    await this.paymentMethodsPage.waitForOneyLoad();
  };

  doKlarnaPayment = async () => {
    await this.paymentMethodsPage.initiateKlarnaPayment(undefined);
  };

  completeKlarnaRedirect = async (success, skipModal) => {
    if (success) {
      await this.paymentMethodsPage.confirmKlarnaPayment(skipModal);
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

  doGiropayPayment = async () => {
    await this.page.click('#rb_giropay');
  };

  doRivertyPayment = async (email) => {
    await this.page.click('#rb_riverty');
    await this.page.fill('input[name="dateOfBirth"]', '1980-01-11');
    await this.page.fill('input[name="shopperEmail"]', email);
    // There is no static locator to click the checkbox
    await this.page.locator('label:has-text("Ich bin mit")').click();
};

  completeGiropayRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmGiropayPayment();
    } else {
      await this.paymentMethodsPage.cancelGiropayPayment();
    }
  };

  doEPSPayment = async () => {
    await this.paymentMethodsPage.initiateEPSPayment();
  };

  completeEPSRedirect = async (success) => {
    await this.page.waitForLoadState('networkidle');
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

  doVippsPayment = async () => {
    await this.page.click('#rb_vipps');
  };

  completeVippsRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmVippsPayment();
    } else {
      await this.paymentMethodsPage.cancelVippsPayment();
    }
  };

  doTrustlyPayment = async () => {
    await this.page.click('#rb_trustly');
  };

  completeTrustlyRedirect = async (success) => {
    if (success) {
      await this.paymentMethodsPage.confirmTrustlyPayment();
    } else {
      await this.paymentMethodsPage.cancelTrustlyPayment();
    }
  };

  doMobilePayPayment = async () => {
    await this.page.click('#rb_mobilepay');
  };

  completeMobilePayRedirect = async () => {
    await this.paymentMethodsPage.confirmMobilePayPayment();
  };
}
