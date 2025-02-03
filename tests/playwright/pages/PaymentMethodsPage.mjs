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
    await this.page.waitForNavigation('load');
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
  };

  initiateGooglePayExpressPayment = async () => {
    await this.page.waitForTimeout(5000);
    const googlePayButton = this.page.locator('#gpay-button-online-api-id');
    expect(googlePayButton).toBeVisible();
  }

  initiatePayPalPayment = async (expressFlow, shippingChange, success, taxation) => {
    // Paypal button locator on payment methods page
    const payPalButton = this.page
      .frameLocator('.adyen-checkout__paypal__button--paypal iframe.visible')
      .locator('.paypal-button-container');

    const popupPromise = this.page.waitForEvent('popup');

    // Click PayPal radio button
    if (!expressFlow) {
      await this.page.click('#rb_paypal');
      await this.page.waitForTimeout(5000);
    }

    await payPalButton.click();
    const popup = await popupPromise;	

    // Wait for the page load
    await popup.waitForNavigation({
      url: /.*sandbox.paypal.com*/,
    });

    // Paypal HPP selectors
    this.emailInput = popup.locator('#email');
    this.nextButton = popup.locator('#btnNext');
    this.passwordInput = popup.locator('#password');
    this.loginButton = popup.locator('#btnLogin');
    this.agreeAndPayNowButton = popup.locator('#payment-submit-btn');
    this.shippingMethodsDropdown = popup.locator('#shippingMethodsDropdown');
	this.changeAddress = popup.locator('button[data-testid="change-shipping"]');
	this.selectAddress = popup.locator('#shippingDropdown');
    this.cancelButton = popup.locator('a[data-testid="cancel-link"]');

    await this.emailInput.click();
    await this.emailInput.fill(paymentData.PayPal.username);
    await this.nextButton.click();
    await this.passwordInput.fill(paymentData.PayPal.password);
    await this.loginButton.click();
    await this.page.waitForTimeout(5000);

    if (shippingChange){
        await this.shippingMethodsDropdown.selectOption({ index: 2 }); // This selects the second option as first one is hidden by default in paypal modale
        await this.page.waitForTimeout(5000);
    }

    if (taxation){
        await this.changeAddress.click();
        await this.selectAddress.selectOption({ value : '7926545394260875927' });
    }

    if (success) {
	await this.agreeAndPayNowButton.click();
    }
    else {
	await this.cancelButton.click();
	await this.page.goBack();
	await expect(this.page.locator('.add-to-cart'),).toBeVisible();
    }
  };

  initiateAmazonPayment = async (
    normalFlow = true,
    success = true,
    selectedCard
  ) => {
    if (normalFlow) {
      await this.page.click("#rb_amazonpay");
    }
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.click(".adyen-checkout__amazonpay__button");
  
    // Amazon Sandbox selectors
    this.emailInput = this.page.locator("#ap_email");
    this.passwordInput = this.page.locator("#ap_password");
    this.loginButton = this.page.locator("#signInSubmit");
    this.changePaymentButton = this.page.locator("#change-payment-button");
    this.confirmPaymentChangeButton = this.page.locator("#a-autoid-8");
    this.amazonCaptcha = this.page.locator('//img[contains(@alt,"captcha")]');

    await this.emailInput.click();
    await this.emailInput.type(paymentData.AmazonPay.username);
    await this.passwordInput.click();
    await this.passwordInput.type(paymentData.AmazonPay.password);
    await this.loginButton.click();
    await this.page.waitForLoadState("networkidle");

    if (await this.amazonCaptcha.isVisible()){
      return false;
    }

    // Handles the saved 3DS2 Masstercard saved in Amazon Sandbox
    if (selectedCard == "3ds2_card") {
      
      await this.changePaymentButton.click();
      await this.page.click(".MASTERCARD");
      await this.confirmPaymentChangeButton.click();
    }
  
    if (!success) {
      await this.changePaymentButton.click();
      this.rejectionCard = this.page.locator(
        'label[for="wallet_auth_decline_processing_failure"]'
      );
      await this.rejectionCard.click();
      await this.confirmPaymentChangeButton.click();
    }
    await this.page.waitForLoadState("networkidle");
    this.submitButton = this.page.locator('#a-autoid-0');
    await this.submitButton.waitFor({ state: 'visible' });
    await this.submitButton.click();
  };
  
  continueAmazonExpressFlow = async () => {
    this.amazonCaptcha = this.page.locator('//img[contains(@alt,"captcha")]');
    this.confirmExpressPaymentButton = this.page.locator(
      ".adyen-checkout__button--pay"
    );
    if (await this.amazonCaptcha.isVisible()){
      return false;
    }
    await this.confirmExpressPaymentButton.click();
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

  initiateUPIPayment = async (paymentMethod, success = true) => {
    const continueButton = this.page.locator(".adyen-checkout__button--pay");
    await this.page.locator(`#rb_upi`).click();
    if (paymentMethod == "upi_collect") {
      await this.page.locator("#upi-button-vpa").click();

      success == true ? await this.page.locator("#component_upi input").fill("testvpa@icici")
        : await this.page.locator("#component_upi input").fill("notCorrectWillFail");
    }
    if (paymentMethod == "upi_qr") {
      await this.page.locator("#upi-button-qrCode").click();
    }
    await continueButton.click();
  };


  billdeskSimulator = async (success) => {
    const select = await this.page.locator('#BankStatus');
    const result = success ? 'Success' : 'Failure';
    await select.selectOption({ label: `${result}` });
    await this.page.locator('#SubmitForm').click();
  };

  submitSimulator = async (testSuccess) => {
    await this.page.locator('button[data-testid="payment-action-button"]').click();
    await this.page.locator('button[id="bank-item-TESTNL2A"]').click();
    const actionButton = testSuccess ? this.page.getByRole('button', { name: 'Success', exact: true }) : this.page.getByRole('button', { name: 'Cancellation', exact: true });
    await actionButton.click();
  };

  submitBankSimulator = async () => {
    await this.page.locator('#mainSubmit').click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page.locator('#rb_scheme').click();

    const ccComponentWrapper = this.page.locator("#component_scheme");

    await ccComponentWrapper
      .locator('.adyen-checkout__card__holderName__input')
      .fill(cardInput.holderName);

    const cardNumberInputField = ccComponentWrapper
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field');
    await cardNumberInputField.click();
    await cardNumberInputField.fill(cardInput.cardNumber);

    const expirationDateInputField = ccComponentWrapper
      .frameLocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field');
    await expirationDateInputField.click();
    await expirationDateInputField.fill(cardInput.expirationDate);

    if (cardInput.cvc !== '') {
      const cvcInputField = ccComponentWrapper
        .frameLocator('.adyen-checkout__card__cvc__input iframe')
        .locator('.input-field');
      await cvcInputField.click();
      await cvcInputField.fill(cardInput.cvc);
    }
  };

  initiateGiftCardPayment = async (giftCardInput) => {
    const giftCardComponentWrapper = this.page.locator(".gift-card-selection");
	// Adding a timeout to ensure visibility
    await new Promise(r => setTimeout(r, 2000));
    await this.page.locator('#giftCardAddButton').click();
    await this.page.locator('.gift-card-select-wrapper').click()
    const giftCardBrand = this.page.locator(`li[data-brand=${giftCardInput.brand}]`)
    await this.page.locator("#giftCardUl").waitFor({
      state: 'visible',
    });
    await giftCardBrand.click();

    const giftCardNumberInputField = giftCardComponentWrapper
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field');

	  const giftCardPinField = giftCardComponentWrapper
      .frameLocator('.adyen-checkout__card__cvc__input iframe')
      .locator('.input-field');

    await giftCardNumberInputField.click();
    await giftCardNumberInputField.fill(giftCardInput.cardNumber);

    await giftCardPinField.click();
    await giftCardPinField.fill(giftCardInput.pin);

    await this.page.locator(".adyen-checkout__button--pay").click();
    await new Promise(r => setTimeout(r, 2000));
    
    if (await this.page.locator(".adyen-checkout__button--pay").isVisible()){
	    await this.page.locator(".adyen-checkout__button--pay").click();
    }
  }

  initiateOneClickPayment = async (oneClickCardInput) => {
    /*TODO: Simplify the locator strategy here if possible
    const cardLabelRegex = new RegExp(
      oneClickCardInput.oneClickLabel.replace(/[*]/g, '\\$&'),
    );
    Still keeping the old regexp due to potential use for SG*/
    const oneClickLi = this.page.locator(
      `//label[contains(text(),"${oneClickCardInput.oneClickLabel}")]/..`,
    ).first();

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
      "iframe[name='threeDSIframe']",
    );
    await verificationIframe.locator('input[name="answer"]').fill('password');
    await verificationIframe.locator('button[type="submit"]').click();
  };

  selectInstallments = async (nrInstallments) => {
    const installmentsDiv = await this.page.locator(
      '.adyen-checkout__installments',
    );
    await installmentsDiv.locator('button').click();
    await this.page.locator(`li[data-value="${nrInstallments}"]`).click();
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
    await oneyEmail.fill('');
    await oneyEmail.type(shopper.shopperEmail);
  };

  waitForOneyLoad = async () => {
    //Simulation of the redirect to the Oney page
    await this.page.waitForNavigation({
      url: /.*staging.e-payments.oney/,
    });
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

  // Let's try to get Klarna HPP parts from the other framework later
  waitForKlarnaLoad = async () => {
    await this.page.waitForNavigation({
      url: /.*playground.klarna/,
      waitUntil: 'load',
    });
  };

  // Generic function to be used for simulating the redirect
  waitForRedirect = async () => {
    await this.page.waitForNavigation({
      waitUntil: 'load',
    });
  };

  async continueOnKlarna(skipModal) {
    await this.waitForKlarnaLoad();
    await this.page.waitForLoadState('networkidle');
    this.klarnaIframe = this.page.frameLocator(
      '#klarna-apf-iframe',
    );
    this.klarnaContinueButton = this.klarnaIframe.locator('#onContinue');
    this.klarnaVerificationCodeInput = this.klarnaIframe.locator('#otp_field');
    this.klarnaSelectPlanButton = this.klarnaIframe.locator("button[data-testid='pick-plan']");
    this.klarnaBuyButton = this.klarnaIframe.locator("button[data-testid='confirm-and-pay']");
    this.klarnaDirectDebitPlan = this.klarnaIframe.locator("div[id='directdebit.0-ui']"); // used for Klarna Pay Now

    await this.klarnaContinueButton.click();
    await this.klarnaVerificationCodeInput.waitFor({
      state: 'visible',
    });
    await this.klarnaVerificationCodeInput.fill('123456');
    if (this.klarnaSelectPlanButton.isVisible() && !skipModal) {
      await this.klarnaDirectDebitPlan.click();
      await this.klarnaSelectPlanButton.click();
    }
    await this.klarnaBuyButton.waitFor({
      state: 'visible',
    });
    await this.klarnaBuyButton.click();
  }

  confirmKlarnaPayNowPayment = async () => {
    await this.continueOnKlarna();
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

  confirmKlarnaPayment = async (skipModal) => {
    await this.continueOnKlarna(skipModal);
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

    await this.page.waitForNavigation('networkidle');
    await this.klarnaPaymentMethodGroup.waitFor('visible');
    await this.page.waitForLoadState('networkidle');
    await this.klarnaBuyButton.waitFor('visible');

    await this.klarnaBuyButton.click();
    await this.klarnaIdNumberField.fill('811228-9874');
    await this.approvePurchaseButton.click();
  };

  cancelKlarnaPayment = async () => {
    await this.waitForKlarnaLoad();
    await this.page.waitForLoadState('networkidle');
    this.cancelButton = this.page.locator("button[title='Close']");
    await this.cancelButton.click();
    await this.page.click("button[id='payment-cancel-dialog-express__confirm']");
  };

  cancelGiropayPayment = async () => {
    const rejectCookies = this.page.locator('.rds-cookies-overlay__allow-essential-cookies-btn');
    const giroBankDropdown = this.page.locator('#bankSearch');
    const backButton = this.page.locator("button[name='backLink']");

    await rejectCookies.click();
    await giroBankDropdown.waitFor({ state: 'visible' });
    await backButton.waitFor({ state: 'visible' });
    await backButton.click();
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
    await this.page.waitForLoadState('load');
    const affirmEmail = this.page.locator(
      '#component_affirm input[name="shopperEmail"]',
    );
    await this.page.click('#rb_affirm');
    await affirmEmail.fill(shopper.shopperEmail);
  };

  initiateCashAppPayment = async () => {
    await this.page.waitForLoadState('load');
    await this.page.click('#rb_cashapp');
    await this.page.click('#component_cashapp');
    await this.page.locator("div[data-testid='qr-modal-body']").waitFor({
      state: 'visible',
    });
  }

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
    await this.page.click("button[data-testid='nav-close-button']");
  };

  confirmVippsPayment = async () => {
    await this.page.locator("div[class='payment-details']").waitFor({
      state: 'visible',
    });
  };

  cancelVippsPayment = async () => {
    await expect(this.page.locator('.cancel-link')).toBeVisible();
    await this.page.click('.cancel-link');
  };

  confirmTrustlyPayment = async () => {
    await this.page.click("text=DNB");
    await this.page.click("button[data-testid='continue-button']");
    await this.page.locator("div[data-testid='spinner']").waitFor({
      state: 'visible',
    });
    await this.page.click("button[data-testid='continue-button']");
    await this.page.locator('input[name="loginid"]').type('idabarese51');
    await this.page.click("button[data-testid='continue-button']");
    await this.page.locator("div[data-testid='spinner']").waitFor({
      state: 'visible',
    });
    await this.page.locator("div[data-testid='spinner']").waitFor({
      state: 'detached',
    });

    const oneTimeCodeLocator = await this.page.locator(
      "h3",
    );
    let oneTimeCode = await oneTimeCodeLocator.innerText();

    await this.page
      .locator("input[data-testid='Input-password-challenge_response']")
      .type(oneTimeCode);
    await this.page.click("button[data-testid='continue-button']");
    await this.page.locator("div[data-testid='spinner']").waitFor({
      state: 'visible',
      timeout: 20000,
    });
    await this.page.click("button[data-testid='continue-button']");

    await this.page.waitForLoadState('load');
    oneTimeCodeLocator.waitFor({ state: 'visible', timeout: 20000 });
    oneTimeCode = await oneTimeCodeLocator.innerText();

    await this.page.locator("input[data-testid='Input-password-challenge_response']").type(oneTimeCode);
    await this.page.click("button[data-testid='continue-button']");
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
    // Extra static wait due to flaky load times
    await new Promise(r => setTimeout(r, 2000));
    await this.page.click(`#rb_${paymentMethod}`);
  };

  cancelQRCode = async () => {
    await this.page.click('#cancelQrMethodsButton');
    await expect(this.page).toHaveURL(/stage=shipping#shipping/);
  };

  initiateBoletoPayment = async () => {
    const socialSecurityInput = this.page.locator(
      '#component_boletobancario input[name="socialSecurityNumber"]',
    );
    await this.page.click('#rb_boletobancario');
    await socialSecurityInput.type('56861752509');
  };

  MultiBancoVoucherExists = async () => {
    await expect(
      this.page.locator('.adyen-checkout__voucher-result--multibanco'),
    ).toBeVisible();
  };

  initiateSEPAPayment = async () => {
    const nameInput = this.page.locator('input[name="ownerName"]');
    const ibanInput = this.page.locator('input[name="ibanNumber"]');

    await this.page.click('#rb_sepadirectdebit');
    await expect(ibanInput).toBeVisible();
    await nameInput.fill(paymentData.SepaDirectDebit.accountName);
    await ibanInput.fill(paymentData.SepaDirectDebit.iban);
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
