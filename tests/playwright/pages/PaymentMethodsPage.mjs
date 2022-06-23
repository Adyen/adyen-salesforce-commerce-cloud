import expect from '@playwright/test';
import { ShopperData } from '../data/shopperData.mjs';
import { PaymentData } from '../data/paymentData.mjs';

const shopperData = new ShopperData();
const paymentData = new PaymentData();

export default class PaymentMethodsPage {
  constructor(page) {
    this.page = page;
  }

  getLocation = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })();
    return await this.page.url();
  };

  initiateIdealPayment = async (testSuccess) => {
    const iDealInput = this.page.locator('input[value="ideal"]');
    const iDealDropDown = this.page.locator(
      '#component_ideal .adyen-checkout__dropdown__button',
    );
    const issuer = testSuccess
      ? this.page.locator('#component_ideal .adyen-checkout__dropdown__list li')
      : this.page.locator('#component_ideal li[data-value="1160"]');

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

    // Capture popup for interaction
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      payPalButton.click(),
    ]);

    // Wait for the page load
    await popup.waitForNavigation({
      url: /.*sandbox.paypal.com*/,
      timeout: 15000,
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
    const issuer = this.page.locator(
      `#component_${paymentMethod} .adyen-checkout__dropdown__list li`,
    );
    await input.click();
    await dropDown.click();
    await issuer.click();
  };

  billdeskSimulator = async (success) => {
    const select = await page.locator('#BankStatus');
    const result = success ? 'Success' : 'Failure';
    await select.selectOption(`${result}`);
    await this.page.locator('#SubmitForm').click();
  };

  submitSimulator = async () => {
    await this.page.locator('input[type="submit"]').click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page.locator('#rb_scheme').click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });

    await this.page
      .locator('.adyen-checkout__card__holderName__input')
      .type(cardInput.holderName);

    await this.page
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field')
      .type(cardInput.cardNumber);
    await this.page
      .frameLocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field')
      .type(cardInput.expirationDate);
    if (cardInput.cvc !== '') {
      await this.page
        .frameLocator('.adyen-checkout__card__cvc__input iframe')
        .locator('.input-field')
        .type(cardInput.cvc);
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

  initiateOneyPayment = async (shopper) => {
    const oneyGender = this.page.locator(
      '#component_facilypay_4x input[value="MALE"]',
    );
    const oneyDateOfBirth = this.page.locator(
      '#component_facilypay_4x .adyen-checkout__input--dateOfBirth',
    );
    const oneyEmail = this.page.locator(
      '#component_facilypay_4x input[name="shopperEmail"]',
    );

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
    let klarnaSelector = this.page.locator('#rb_klarna');
    if (klarnaVariant) {
      klarnaSelector =
        klarnaVariant == 'paynow'
          ? this.page.locator('#rb_klarna_paynow')
          : this.page.locator('#rb_klarna_account');
    }
    await klarnaSelector.click();
  };

  /* Let's try to get Klarna HPP parts from the other framework later

  confirmKlarnaPayNowPayment = async () => {
    const ibanSelector = this.page.locator('#iban');
    await Selector('#payment-method-selector')();
    await t
      .click('#buy-button')
      .switchToIframe('#klarna-hpp-instance-fullscreen')
      .typeText('#addressCollector-date_of_birth', '01011991')
      .click('#dd-identification-dialog__footer-button-wrapper button');
    if (await ibanSelector.exists) {
      await t
        .typeText(ibanSelector, 'DE11520513735120710131')
        .click('#aligned-content__button__0');
    }
    await t.click('#aligned-content__button__0').switchToMainWindow();
  };

  confirmKlarnaAccountPayment = async () => {
    await Selector('#payment-method-selector')();
    await t
      .click('#buy-button')
      .switchToIframe('#klarna-hpp-instance-fullscreen')
      .typeText(
        '#baseaccount_kp-purchase-approval-form-date-of-birth',
        '01011991',
      )
      .click('#baseaccount_kp-purchase-approval__bottom')
      .switchToMainWindow();
  };

  confirmKlarnaPayment = async () => {
    await Selector('#payment-method-selector')();
    await t
      .click(Selector('#buy-button'))
      .switchToIframe('#klarna-hpp-instance-fullscreen')
      .typeText(
        Selector('#invoice_kp-purchase-approval-form-date-of-birth'),
        '01011991',
      )
      .click(Selector('#invoice_kp-purchase-approval-form-continue-button'))
      .switchToMainWindow();
  };

  confirmKlarnaPaymentWithIDNumber = async () => {
    await Selector('#payment-method-selector')();
    await t
      .click(Selector('#buy-button'))
      .switchToIframe('#klarna-hpp-instance-fullscreen')
      .typeText(
        Selector(
          '#invoice_kp-purchase-approval-form-national-identification-number',
        ),
        '811228-9874',
      )
      .click(Selector('#invoice_kp-purchase-approval-form-continue-button'))
      .switchToMainWindow();
  };

  cancelKlarnaDirectEBankingPayment = async () => {
    await t
      .click(Selector('.back-to-merchant cancel-transaction'))
      .click(Selector('#CancelTransaction'));
  };
  */

  cancelKlarnaPayment = async () => {
    await this.page.click('#back-button');
  };

  confirmGiropayPayment = async (giroPayData) => {
    const giroBank = this.page.locator('#ui-id-1 li a');
    const giroBankDropdown = this.page.locator('#tags');
    await giroBankDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await giroBankDropdown.type(giroPayData.bankName);

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
    const epsInput = page.locator('input[value="eps"]');
    const epsDropDown = page.locator(
      '#component_eps .adyen-checkout__dropdown__button',
    );
    const epsIssuer = page.locator(
      '#component_eps .adyen-checkout__dropdown__list li',
    );

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
  };

  cancelSimulator = async () => {
    //Cancel the simulator
  };

  cancelAffirmPayment = async () => {
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.click('#close-button');
  };

  confirmVippsPayment = async () => {
    expect(this.getLocation()).toContain('apitest.vipps.no');
  };

  cancelVippsPayment = async () => {
    await this.page.click('.cancel-link');
  };

  confirmTrustlyPayment = async () => {
    await this.page.click('img[alt="DNB"]');
    await this.page.click('.button_next');
    await this.page.locator('input[name="loginid"]').type('idabarese51');
    await this.page.click('.button_next');

    const oneTimeCode = await this.page.locator('.message_value').innerText();

    await this.page.locator('input[name="otp"]').type(oneTimeCode);
    await this.page.click('.button_next');
    await this.page.click('.button_next');

    await this.page.locator('input[name="password"]').type('password');
    await this.page.click('.button_next');
    await this.page.click('.button_next');

    const secondOneTimeCodeLocator = await this.page.locator('.message_value');
    secondOneTimeCodeLocator.waitFor({ state: 'visible', timeout: 20000 });
    const secondOneTimeCode = await secondOneTimeCodeLocator.innerText();

    await this.page.locator('input[type="password"]').type(secondOneTimeCode);
    await this.page.click('.button_next');
  };

  cancelTrustlyPayment = async () => {
    await this.page.click('#core_order_cancel');
    await this.page.click('.prompt-yes');
  };

  confirmMobilePayPayment = async () => {
    expect(this.getLocation()).toContain('sandprod-products.mobilepay.dk');
  };

  initiateMultiBancoPayment = async () => {
    await this.page.click('input[value="multibanco"]');
  };

  initiateMBWayPayment = async () => {
    await this.page.click('input[value="mbway"]');
    await this.page.click('#component_mbway button');
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
    const nameInput = Selector('input[name="sepa.ownerName"]');
    const ibanInput = Selector('input[name="sepa.ibanNumber"]');

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
      .locator('input[name="econtext.shopperEmail"]')
      .fill(shopperData.JP.shopperEmail);
    await this.page
      .locator('input[name="econtext.telephoneNumber"]')
      .fill('3333333333');
  };
}
