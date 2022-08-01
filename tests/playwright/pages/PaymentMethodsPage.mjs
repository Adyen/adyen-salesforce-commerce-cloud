import { expect } from '@playwright/test';
import { ShopperData } from '../data/shopperData.mjs';
import { PaymentData } from '../data/paymentData.mjs';

const shopperData = new ShopperData();
const paymentData = new PaymentData();

export default class PaymentMethodsPage {
  constructor(page) {
    this.page = page;
  }

  getLocation = async () => {
    await this.page.waitForNavigation('load', { timeout: 10000 });
    return await this.page.url();
  };

  initiateIdealPayment = async (testSuccess) => {
    const iDealInput = this.page.locator('input[value="ideal"]');
    const iDealDropDown = this.page.locator(
      '#component_ideal .adyen-checkout__dropdown__button',
    );
    const issuer = testSuccess
      ? this.page.locator(
          '#component_ideal .adyen-checkout__dropdown__list li [alt="Test Issuer"]',
        )
      : this.page.locator(
          '#component_ideal .adyen-checkout__dropdown__list li [alt="Test Issuer Refused"]',
        );

    await this.page.locator('#rb_ideal').click();
    await iDealInput.click();
    await iDealDropDown.click();
    await issuer.click();
  };

  initiatePayPalPayment = async () => {
    // Paypal button locator on payment methods page
    const payPalButton = this.page
      .frameLocator('.adyen-checkout__paypal__button--paypal iframe.visible')
      .locator('.paypal-button');

    // Click PayPal radio button
    await this.page.click('#rb_paypal');
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });

    // Capture popup for interaction
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      payPalButton.click(),
    ]);

    // Wait for the page load
    await popup.waitForNavigation({
      url: /.*sandbox.paypal.com*/,
      timeout: 20000,
    });

    // Paypal HPP selectors
    this.emailInput = popup.locator('#email');
    this.nextButton = popup.locator('#btnNext');
    this.passwordInput = popup.locator('#password');
    this.loginButton = popup.locator('#btnLogin');
    this.agreeAndPayNowButton = popup.locator('#payment-submit-btn');

    await this.emailInput.click();
    await this.emailInput.fill(paymentData.PayPal.username);
    await this.nextButton.click();
    await this.passwordInput.fill(paymentData.PayPal.password);
    await this.loginButton.click();
    await this.agreeAndPayNowButton.click();
  };

  initiateBillDeskPayment = async (paymentMethod) => {
    await this.page.locator(`#rb_${paymentMethod}`).click();
    if (paymentMethod === 'billdesk_upi') {
      return;
    }
    const input = this.page.locator(`input[value="${paymentMethod}"]`);
    const dropDown = this.page.locator(
      `#component_${paymentMethod} .adyen-checkout__dropdown__button`,
    );
    const issuer = this.page
      .locator(`#component_${paymentMethod} .adyen-checkout__dropdown__list li`)
      .first();
    await input.click();
    await dropDown.click();
    await issuer.click();
  };

  billdeskSimulator = async (success) => {
    const select = await this.page.locator('#BankStatus');
    const result = success ? 'Success' : 'Failure';
    await select.selectOption({ label: `${result}` });
    await this.page.locator('#SubmitForm').click();
  };

  submitSimulator = async () => {
    await this.page.locator('input[type="submit"]').click();
  };

  submitBankSimulator = async () => {
    await this.page.locator('#mainSubmit').click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page.locator('#rb_scheme').click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });

    await this.page
      .locator('.adyen-checkout__card__holderName__input')
      .fill(cardInput.holderName);

    const cardNumberInputField = this.page
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field');
    await cardNumberInputField.click();
    await cardNumberInputField.fill(cardInput.cardNumber);

    const expirationDateInputField = this.page
      .frameLocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field');
    await expirationDateInputField.click();
    await expirationDateInputField.fill(cardInput.expirationDate);

    if (cardInput.cvc !== '') {
      const cvcInputField = this.page
        .frameLocator('.adyen-checkout__card__cvc__input iframe')
        .locator('.input-field');
      await cvcInputField.click();
      await cvcInputField.fill(cardInput.cvc);
    }
  };

  initiateOneClickPayment = async (oneClickCardInput) => {
    /*TODO: Simplify the locator strategy here if possible
    const cardLabelRegex = new RegExp(
      oneClickCardInput.oneClickLabel.replace(/[*]/g, '\\$&'),
    );
    Still keeping the old regexp due to potential use for SG*/
    const oneClickLi = this.page.locator(
      `//label[contains(text(),"${oneClickCardInput.oneClickLabel}")]/..`,
    );
    await oneClickLi.locator('input[name="brandCode"]').click();
    if (oneClickCardInput.cvc !== '') {
      await oneClickLi
        .frameLocator('iframe')
        .locator('input[data-fieldtype="encryptedSecurityCode"]')
        .type(oneClickCardInput.cvc);
    }
  };

  do3Ds1Verification = async () => {
    await this.page.locator('#username').type('user');
    await this.page.locator('#password').type('password');
    await this.page.locator('.paySubmit').click();
  };

  do3Ds2Verification = async () => {
    const verificationIframe = this.page.frameLocator(
      '.adyen-checkout__threeds2__challenge iframe',
    );
    await verificationIframe.locator('input[name="answer"]').fill('password');
    await verificationIframe.locator('button[type="submit"]').click();
  };

  selectInstallments = async (nrInstallments) => {
    const installmentsDiv = await this.page.locator(
      '.adyen-checkout__installments',
    );
    await installmentsDiv.locator('button').click();
    await this.page(`li[data-value="${nrInstallments}"]`).click();
  };

  fillOneyForm = async (shopper) => {
    //Filling the form in checkout side
    await this.page.locator('input[value="MALE"]').click();
    await this.page
      .locator('input[name="dateOfBirth"]')
      .type(shopper.dateOfBirth);
    await this.page
      .locator('.adyen-checkout__input--shopperEmail')
      .type(shopper.shopperEmail);
  };
  initiateOneyPayment = async (shopper) => {
    const oneyForm = this.page.locator('#component_facilypay_4x');
    const oneyGender = oneyForm.locator('//input[@value="MALE"]/../label');
    const oneyDateOfBirth = oneyForm.locator(
      '.adyen-checkout__input--dateOfBirth',
    );
    const oneyEmail = oneyForm.locator('input[name="shopperEmail"]');

    await this.page.locator('#rb_facilypay_4x').click();
    await oneyGender.click();
    await oneyDateOfBirth.click();
    await oneyDateOfBirth.type(shopper.dateOfBirth);
    await oneyEmail.type(shopper.shopperEmail);
  };

  confirmOneyPayment = async () => {
    //Simulation on the Oney page
  };

  initiateKlarnaPayment = async (klarnaVariant) => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    let klarnaSelector = this.page.locator('#rb_klarna');
    if (klarnaVariant) {
      klarnaSelector =
        klarnaVariant == 'paynow'
          ? this.page.locator('#rb_klarna_paynow')
          : this.page.locator('#rb_klarna_account');
    }
    await klarnaSelector.click();
  };

  // Let's try to get Klarna HPP parts from the other framework later
  waitForKlarnaLoad = async () => {
    await this.page.waitForNavigation({
      url: /.*playground.klarna/,
      timeout: 15000,
      waitUntil: 'networkidle',
    });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  };

  async continueOnKlarna() {
    await this.waitForKlarnaLoad();
    this.klarnaIframe = this.page.frameLocator(
      '#klarna-hpp-instance-fullscreen',
    );

    this.klarnaBuyButton = this.page.locator('#buy-button');
    this.klarnaContinueButton = this.klarnaIframe.locator('#onContinue');
    this.klarnaVerificationCodeInput = this.klarnaIframe.locator('#otp_field');

    await this.klarnaBuyButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.klarnaBuyButton.click();

    /* Commenting out this section since the phone number comes
    prefilled nowadays

    await this.klarnaPhoneInput.waitFor({
      state: "visible",
      timeout: 10000,
    });
    await this.klarnaPhoneInput.fill(); */

    await this.klarnaContinueButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.klarnaContinueButton.click();
    await this.klarnaVerificationCodeInput.waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.klarnaVerificationCodeInput.fill('123456');
  }

  confirmKlarnaPayNowPayment = async () => {
    await this.continueOnKlarna();
    await this.page
      .frameLocator('#klarna-hpp-instance-fullscreen')
      .locator('#dd-confirmation-dialog__bottom button')
      .click();
  };

  confirmKlarnaAccountPayment = async () => {
    await this.continueOnKlarna();
    const klarnaHppIframe = this.page.frameLocator(
      '#klarna-hpp-instance-fullscreen',
    );
    await klarnaHppIframe
      .locator('#fixedsumcredit_kp-purchase-review-secci-toggle__box')
      .click();
    await klarnaHppIframe
      .locator('#fixedsumcredit_kp-purchase-review-continue-button')
      .click();
  };

  confirmKlarnaPayment = async () => {
    await this.continueOnKlarna();
    await this.page
      .frameLocator('#klarna-hpp-instance-fullscreen')
      .locator('#invoice_kp-purchase-review-continue-button')
      .click();
  };

  cancelKlarnaDirectEBankingPayment = async () => {
    // await t
    //   .click(Selector('.back-to-merchant cancel-transaction'))
    //   .click(Selector('#CancelTransaction'));
  };

  confirmKlarnaPaymentWithIDNumber = async () => {
    this.klarnaBuyButton = this.page.locator('#buy-button');
    this.klarnaFullScreenIframe = this.page.frameLocator(
      '#klarna-hpp-instance-fullscreen',
    );
    this.klarnaHppIframe = this.page.frameLocator('#klarna-hpp-instance-main');

    this.klarnaIdNumberField = this.klarnaFullScreenIframe.locator(
      '#invoice_kp-purchase-approval-form-national-identification-number',
    );
    this.approvePurchaseButton = this.klarnaFullScreenIframe.locator(
      '#invoice_kp-purchase-approval-form-continue-button',
    );

    this.klarnaPaymentMethodGroup = this.klarnaHppIframe.locator(
      '#invoice_kp-invoice-payment-method',
    );

    await this.page.waitForNavigation('networkidle', { timeout: 10000 });
    await this.klarnaPaymentMethodGroup.waitFor('visible', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.klarnaBuyButton.waitFor('visible', { timeout: 10000 });

    await this.klarnaBuyButton.click();
    await this.klarnaIdNumberField.fill('811228-9874');
    await this.approvePurchaseButton.click();
  };

  cancelKlarnaPayment = async () => {
    await this.waitForKlarnaLoad();
    await this.page.click('#back-button');
  };

  confirmGiropayPayment = async (giroPayData) => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });

    const giroBank = this.page.locator('#ui-id-1 li a');
    const giroBankDropdown = this.page.locator('#tags');

    await giroBankDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await giroBankDropdown.type(giroPayData.bankName, { delay: 50 });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });

    await giroBank.waitFor({ state: 'visible', timeout: 10000 });
    await giroBank.click();
    await this.page.click('input[name="continueBtn"]');
    await this.page.click('#yes');
    await this.page.locator('input[name="sc"]').type(giroPayData.sc);
    await this.page
      .locator('input[name="extensionSc"]')
      .type(giroPayData.extensionSc);
    await this.page
      .locator('input[name="customerName1"]')
      .type(giroPayData.customerName);
    await this.page
      .locator('input[name="customerIBAN"]')
      .type(giroPayData.customerIban);
    await this.page.click('input[value="Absenden"]');
  };

  cancelGiropayPayment = async () => {
    await this.page.click('#backUrl');
    await this.page.click('.modal-dialog #yes');
  };

  initiateEPSPayment = async () => {
    const epsInput = this.page.locator('input[value="eps"]');
    const epsDropDown = this.page.locator(
      '#component_eps .adyen-checkout__dropdown__button',
    );
    const epsIssuer = this.page
      .locator('#component_eps .adyen-checkout__dropdown__list li')
      .first();

    await this.page.click('#rb_eps');
    await epsInput.click();
    await epsDropDown.click();
    await epsIssuer.click();
  };

  initiateAffirmPayment = async (shopper) => {
    const affirmEmail = this.page.locator(
      '#component_affirm input[name="shopperEmail"]',
    );
    await this.page.click('#rb_affirm');
    await affirmEmail.fill(shopper.shopperEmail);
  };

  confirmSimulator = async () => {
    //Confirm the simulator
    this.page.locator('button[value="authorised"]').click();
  };

  cancelSimulator = async () => {
    //Cancel the simulator
    this.page.locator('button[value="refused"]').click();
  };

  cancelAffirmPayment = async () => {
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.click('#close-button');
  };

  confirmVippsPayment = async () => {
    await expect(await this.getLocation()).toContain('apitest.vipps.no');
  };

  cancelVippsPayment = async () => {
    await this.page.click('.cancel-link');
  };

  confirmTrustlyPayment = async () => {
    await this.page.click('img[alt="DNB"]');
    await this.page.click('.button_next');
    await this.page.locator('input[name="loginid"]').type('idabarese51');
    await this.page.click('.button_next');

    const oneTimeCodeLocator = await this.page.locator(
      "//span[@class='message_label' and contains(text(),'Engangskode')]/../span[@class='message_value']",
    );
    let oneTimeCode = await oneTimeCodeLocator.innerText();

    await this.page
      .locator('input[name="challenge_response"]')
      .type(oneTimeCode);
    await this.page.click('.button_next');
    await this.page.click('.button_next');

    await this.page.waitForLoadState('load');
    oneTimeCodeLocator.waitFor({ state: 'visible', timeout: 20000 });
    oneTimeCode = await oneTimeCodeLocator.innerText();

    await this.page.locator('input[type="password"]').type(oneTimeCode);
    await this.page.click('.button_next');
  };

  cancelTrustlyPayment = async () => {
    await this.page.click('#core_order_cancel');
    await this.page.click('.prompt-yes');
  };

  confirmMobilePayPayment = async () => {
    await expect(await this.getLocation()).toContain(
      'sandprod-products.mobilepay.dk',
    );
  };

  initiateMultiBancoPayment = async () => {
    await this.page.click('input[value="multibanco"]');
  };

  initiateMBWayPayment = async () => {
    await this.page.click('input[value="mbway"]');
  };

  initiateGooglePayPayment = async () => {
    await this.page.click('#rb_paywithgoogle');
    await this.page.click('#component_paywithgoogle button');
  };

  initiateQRCode = async (paymentMethod, envName) => {
    await this.page.click(`#rb_${paymentMethod}`);
    if (envName === 'SG') {
      await this.page.click(`#component_${paymentMethod} button`);
    }
  };

  initiateBoletoPayment = async () => {
    const socialSecurityInput = this.page.locator(
      'input[name="socialSecurityNumber"]',
    );
    await this.page.click('#rb_boletobancario');
    await socialSecurityInput.type('56861752509');
  };

  MultiBancoVoucherExists = async () => {
    await expect(
      this.page.locator('.adyen-checkout__voucher-result--multibanco'),
    ).toBeVisible({ timeout: 10000 });
  };

  initiateSEPAPayment = async () => {
    const nameInput = this.page.locator('input[name="sepa.ownerName"]');
    const ibanInput = this.page.locator('input[name="sepa.ibanNumber"]');

    await this.page.click('#rb_sepadirectdebit');
    await nameInput.type(paymentData.SepaDirectDebit.accountName);
    await ibanInput.type(paymentData.SepaDirectDebit.iban);
  };

  initiateBankTransferPayment = async () => {
    await this.page.click('#rb_bankTransfer_NL');
  };

  initiateKonbiniPayment = async () => {
    await this.page.click('#rb_econtext_stores');
    await this.page
      .locator(
        '#component_econtext_stores .adyen-checkout__input--shopperEmail',
      )
      .fill(shopperData.JP.shopperEmail);
    await this.page
      .locator(
        '#component_econtext_stores input[name="econtext.telephoneNumber"]',
      )
      .fill('3333333333');
  };
}
