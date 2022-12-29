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
    this.selectQuantity = page.locator('#Quantity');
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
    this.successMessage = page.locator('.minicart-quantity');

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

    this.paymentModal = page.locator("#action-modal-SG");
    this.donationAmountButton = page.locator('.adyen-checkout__button').nth(0);
    this.donationButton = page.locator('.adyen-checkout__button--donate');
    this.givingThankyouMessage = page.locator('.adyen-checkout__status__text');
  }

  isPaymentModalShown = async (imgAltValue) => {
    await expect(this.paymentModal.locator(`img[alt='${imgAltValue}']`))
      .toBeVisible({ timeout: 15000 });
  }

  navigateToCheckout = async (locale) => {
    await this.page.goto(this.getCheckoutUrl(locale));
  };

  goToCheckoutPageWithFullCart = async (locale, itemCount = 1) => {
    await this.addProductToCart(locale, itemCount);
    await this.successMessage.waitFor({ visible: true, timeout: 15000 });
    expect(await this.successMessage.textContent()).not.toEqual("0");

    await this.navigateToCheckout(locale);
    await this.checkoutGuest.click();
  };

  getCheckoutUrl(locale) {
    return `/s/SiteGenesis/checkout?lang=${locale}`;
  }

  addProductToCart = async (locale, itemCount = 1) => {
    await this.consentButton.click();
    await this.page.goto(
      `/s/SiteGenesis/turquoise-and-gold-hoop-earring/25720033.html?lang=${locale}`,
    );
    if (itemCount > 1) {
      await this.selectQuantity.fill("");
      await this.selectQuantity.type(`${itemCount}`);
    }
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

    if (await this.checkoutPageUserStateSelect.isVisible()) {
      try {
        await this.checkoutPageUserStateSelect.selectOption({ index: 1 })
      }
      catch {
        await this.checkoutPageUserStateSelect.type(shopperDetails.address.stateOrProvince);
      }
    }

    await this.checkoutPageUserTelephoneInput.type(shopperDetails.telephone);

    await this.checkoutPageUseShippingAddressForBillingCheckBox.click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    await this.shippingSubmit.click();
  };

  setEmail = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    await this.checkoutPageUserEmailInput.fill('');
    await this.checkoutPageUserEmailInput.type('test@adyenTest.com');
  };

  submitShipping = async () => {
    await this.page.waitForLoadState('load', { timeout: 15000 });
    await this.shippingSubmit.click();
  };

  submitPayment = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    await this.submitPaymentButton.click();
  };
  placeOrder = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
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
    await this.page.waitForNavigation('load', { timeout: 15000 });
    await this.navigateBack();
    await this.submitShipping();
  };

  goBack = async () => {
    await this.page.waitForNavigation('load', { timeout: 15000 });
    await this.navigateBack();
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
    await expect(this.voucherCode).toBeVisible({ timeout: 15000 });
  };

  expectQRcode = async () => {
    await this.qrLoader.waitFor({ state: 'attached', timeout: 15000 });
    await expect(this.qrLoaderAmount).toBeVisible({ timeout: 15000 });
    await expect(this.qrImg).toBeVisible({ timeout: 15000 });
  };

  getLocation = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    return await this.page.url();
  };

  navigateBack = async () => {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  };

  navigateBackFromRedirect = async () => {
    await this.page.waitForNavigation('load', { timeout: 15000 });
    await this.navigateBack();
  };

  loginUser = async (credentials) => {
    await this.page.goto('/s/SiteGenesis/account');
    await this.page.waitForLoadState('load', { timeout: 15000 });

    await this.page
      .locator('//input[contains(@id,"dwfrm_login_username_")]')
      .fill(credentials.shopperEmail);
    await this.page
      .locator('//input[contains(@id,"dwfrm_login_password_")]')
      .fill(credentials.password);

    await this.page.click('button[name="dwfrm_login_login"]');
  };

  makeSuccessfulDonation = async () => {
    await this.donationAmountButton.click();
    await this.donationButton.click();
    await expect(this.givingThankyouMessage).toContainText(
      'Thanks for your support',
    );
  };
}
