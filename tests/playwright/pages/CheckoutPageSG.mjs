import { chromium, expect } from '@playwright/test';

export default class CheckoutPageSFRA {
  constructor(page) {
    this.page = page;

    this.consentButton = page.locator(
      '.ui-dialog-buttonset button:first-child',
    );
    this.categoryTile = page.locator('.category-tile');
    this.productCard = page.locator('.name-link');
    this.selectSize = page.locator('.swatchanchor:has-text("6")');
    this.addToCartButton = page.locator('#add-to-cart');
    this.goToCart = page.locator('.minicart-icon');
    this.goToCheckout = page.locator('button[name="dwfrm_cart_checkoutCart"]');
    this.checkoutGuest = page.locator(
      'button[name="dwfrm_login_unregistered"]',
    );
    this.orderConfirmationDetails = page.locator('.order-confirmation-details');

    this.errorMessage = page.locator('.error-form');
    this.thankYouMessage = page.locator('.order-thank-you-msg');
    this.shippingSubmit = page.locator(
      'button[name="dwfrm_singleshipping_shippingAddress_save"]',
    );

    this.checkoutPageUserEmailInput = page.locator(
      '#dwfrm_billing_billingAddress_email_emailAddress',
    );

    this.holderNameInput = page.locator(
      '#card .adyen-checkout__card__holderName input',
    );
    this.cardNumberIFrame = page.locator(
      '.adyen-checkout__card__cardNumber__input iframe',
    );
    this.cardNumberInput = page.locator('#encryptedCardNumber');
    this.expDateIFrame = page.locator(
      '.adyen-checkout__card__exp-date__input iframe',
    );
    this.expDateInput = page.locator('#encryptedExpiryDate');
    this.cvcIFrame = page.locator('.adyen-checkout__card__cvc__input iframe');
    this.cvcInput = page.locator('#encryptedSecurityCode');

    this.oneClickInput = page.locator('.cvc-container input.cvc-field');

    this.placeOrderButton = page.locator('button[name="submit"]');
    this.submitPaymentButton = page.locator('button[id="billing-submit"]');
    this.successMessage = page.locator('.minicart-quantity:has-text("1")');

    this.checkoutPageUserFirstNameInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_firstName',
    );
    this.checkoutPageUserLastNameInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_lastName',
    );
    this.checkoutPageUserStreetInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_address1',
    );
    this.checkoutPageUserHouseNumberInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_address2',
    );
    this.checkoutPageUserCityInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_city',
    );
    this.checkoutPageUserPostCodeInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_postal',
    );
    this.checkoutPageUserCountrySelect = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_country',
    );
    this.checkoutPageUserStateSelect = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_states_state',
    );
    this.checkoutPageUserTelephoneInput = page.locator(
      '#dwfrm_singleshipping_shippingAddress_addressFields_phone',
    );
    this.checkoutPageUseShippingAddressForBillingCheckBox = page.locator(
      '#dwfrm_singleshipping_shippingAddress_useAsBillingAddress',
    );
    this.voucherCode = page.locator('#voucherResult');

    this.qrLoader = this.page.locator('.adyen-checkout__qr-loader');
    this.qrLoaderAmount = this.qrLoader.locator(
      '.adyen-checkout__qr-loader__payment_amount',
    );

    this.qrImg = this.qrLoader.locator('//img[contains(@alt,"QR")]');
  }
  navigateToCheckout = async (locale) => {
    await this.page.goto(this.getCheckoutUrl(locale));
  };

  goToCheckoutPageWithFullCart = async (locale) => {
    await this.addProductToCart(locale);
    await this.successMessage.waitFor({ visible: true, timeout: 10000 });

    await this.navigateToCheckout(locale);
    await this.checkoutGuest.click();
  };

  getCheckoutUrl(locale) {
    return `/s/SiteGenesis/checkout?lang=${locale}`;
  }

  addProductToCart = async (locale) => {
    await this.consentButton.click();
    await this.page.goto(
      `/s/SiteGenesis/turquoise-and-gold-hoop-earring/25720033.html?lang=${locale}`,
    );
    await this.addToCartButton.click();
  };

  setShopperDetails = async (shopperDetails) => {
    await this.checkoutPageUserFirstNameInput.type(
      shopperDetails.shopperName.firstName,
    );
    await this.checkoutPageUserLastNameInput.type(
      shopperDetails.shopperName.lastName,
    );
    await this.checkoutPageUserStreetInput.type(shopperDetails.address.street);
    await this.checkoutPageUserHouseNumberInput.type(
      shopperDetails.address.houseNumberOrName,
    );
    await this.checkoutPageUserCityInput.type(shopperDetails.address.city);
    await this.checkoutPageUserPostCodeInput.type(
      shopperDetails.address.postalCode,
    );

    await this.checkoutPageUserCountrySelect.selectOption(
      shopperDetails.address.country,
    );

    await this.checkoutPageUserTelephoneInput.type(shopperDetails.telephone);

    if (shopperDetails.address.stateOrProvince !== '') {
      await this.checkoutPageUserStateSelect.selectOption(
        shopperDetails.address.stateOrProvince,
      );
    }

    await this.checkoutPageUseShippingAddressForBillingCheckBox.click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.shippingSubmit.click();
  };

  setEmail = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.checkoutPageUserEmailInput.fill('');
    await this.checkoutPageUserEmailInput.type('test@adyenTest.com');
  };

  submitShipping = async () => {
    await this.page.waitForLoadState('load', { timeout: 10000 });
    await this.shippingSubmit.click();
  };

  submitPayment = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.submitPaymentButton.click();
  };
  placeOrder = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.placeOrderButton.click();
  };

  completeCheckoutLoggedInUser = async () => {
    await this.submitPayment();
    await this.placeOrder();
  };

  completeCheckout = async () => {
    await this.setEmail();
    await this.submitPayment();
    await this.placeOrder();
  };

  goBackAndSubmitPayment = async () => {
    await this.navigateBack();
    await this.submitPayment();
  };

  goBackAndSubmitShipping = async () => {
    await this.page.waitForNavigation('load', { timeout: 10000 });
    await this.navigateBack();
    await this.submitShipping();
  };

  goBackAndReplaceOrderDifferentWindow = async () => {
    const checkoutLocation = await this.getLocation();
    await this.placeOrder();

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const secondSession = await context.newPage();

    await secondSession.goto(checkoutLocation);
  };

  expectSuccess = async () => {
    await expect(this.page.locator('.confirmation-message')).toBeVisible({
      timeout: 20000,
    });
  };

  expectNonRedirectSuccess = async () => {
    await this.expectSuccess();
  };

  expectRefusal = async () => {
    await expect(this.errorMessage).not.toBeEmpty();
  };

  expectVoucher = async () => {
    await expect(this.voucherCode).toBeVisible({ timeout: 10000 });
  };

  expectQRcode = async () => {
    await this.qrLoader.waitFor({ state: 'attached', timeout: 10000 });
    await expect(this.qrLoaderAmount).toBeVisible({ timeout: 10000 });
    await expect(this.qrImg).toBeVisible({ timeout: 10000 });
  };

  getLocation = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    return await this.page.url();
  };

  navigateBack = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  };

  navigateBackFromRedirect = async () => {
    await this.page.waitForNavigation('load', { timeout: 10000 });
    await this.navigateBack();
  };

  loginUser = async (credentials) => {
    await this.page.goto('/s/SiteGenesis/account');
    await this.page.waitForLoadState('load', { timeout: 10000 });

    await this.page
      .locator('//input[contains(@id,"dwfrm_login_username_")]')
      .fill(credentials.shopperEmail);
    await this.page
      .locator('//input[contains(@id,"dwfrm_login_password_")]')
      .fill(credentials.password);

    await this.page.click('button[name="dwfrm_login_login"]');
  };
}
