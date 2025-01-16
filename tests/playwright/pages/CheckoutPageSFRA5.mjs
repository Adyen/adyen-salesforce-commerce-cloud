import { chromium, expect } from '@playwright/test';
export default class CheckoutPageSFRA5 {
  constructor(page) {
    this.page = page;

    this.consentButton = page.locator('.affirm');
    this.categoryLink = page.locator('.home-main-categories .category-tile');
    this.productCard = page.locator('.product .image-container a');
    this.colourSelector = page.locator('.color-attribute');
    this.selectSize = page.locator('.select-size');
    this.addToCartButton = page.locator('.add-to-cart');
    this.successMessage = page.locator('.add-to-cart-messages');
    this.selectQuantity = page.locator('.quantity-select');
    this.checkoutUrl =
      '/on/demandware.store/Sites-RefArch-Site/fr_FR/Checkout-Login';
    this.checkoutGuest = page.locator('.checkout-as-guest');

    this.loginUrl = '/customer/account';
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#pass');
    this.submitButton = page.locator('#send2');
    this.customerAccountPage = page.locator('.account.customer-account-index');

    this.checkoutPageUserEmailInput = page.locator('#email');
    this.checkoutPageUserPasswordInput = page.locator(
      'input[name="loginPassword"]',
    );
    this.checkoutPageLoginButton = page.locator('.login button[type="submit"]');

    this.checkoutPageUserFirstNameInput = page.locator(
      '#shippingFirstNamedefault',
    );
    this.checkoutPageUserLastNameInput = page.locator(
      '#shippingLastNamedefault',
    );
    this.checkoutPageUserStreetInput = page.locator(
      '#shippingAddressOnedefault',
    );
    this.checkoutPageUserHouseNumberInput = page.locator(
      '#shippingAddressTwodefault',
    );
    this.checkoutPageUserCityInput = page.locator(
      '#shippingAddressCitydefault',
    );
    this.checkoutPageUserPostCodeInput = page.locator(
      '#shippingZipCodedefault',
    );
    this.checkoutPageUserCountrySelect = page.locator(
      '#shippingCountrydefault',
    );
    this.checkoutPageUserStateSelect = page.locator('#shippingStatedefault');
    this.checkoutPageUserTelephoneInput = page.locator(
      '#shippingPhoneNumberdefault',
    );

    this.shippingSubmit = page.locator('.submit-shipping');

    this.submitPaymentButton = page.locator('.submit-payment');
    this.placeOrderButton = page.locator('.place-order');

    this.errorMessage = page.locator('.error-message-text');
    this.giftCardWarning = page.locator('#giftCardWarningMessage')
    this.thankYouMessage = page.locator('.order-thank-you-msg');

    this.voucherCode = page.locator('#voucherResult');

    this.qrLoader = this.page.locator('.adyen-checkout__qr-loader');
    this.qrLoaderAmount = this.qrLoader.locator(
      '.adyen-checkout__qr-loader__payment_amount',
    );

    this.qrImg = this.qrLoader.locator('//img[contains(@alt,"QR")]');

    this.signInSectionButton = page.locator(
      'a[aria-label="Login to your account"]',
    );
    this.emailField = page.locator('#login-form-email');
    this.passwordField = page.locator('#login-form-password');
    this.loginButton = page.locator('.login button[type="submit"]');

    this.paymentModal = page.locator(".additionalFields");

    this.donationAmountButton = page.locator('.adyen-checkout__button').nth(0);
    this.donationButton = page.locator('.adyen-checkout__button--donate');
    this.givingThankyouMessage = page.locator('.adyen-checkout__status__text');
    this.componentsContainer = page.locator('.payment-methods-container');
  }

  isPaymentModalShown = async (imgAltValue) => {
    await expect(this.paymentModal.locator(`img[alt='${imgAltValue}']`))
      .toBeVisible();
  }

  navigateToCheckout = async (locale) => {
    await this.page.goto(this.getCheckoutUrl(locale));
  };

  navigateToCart = async (locale) => {
    await this.page.goto(this.getCartUrl(locale));
  }

  goToCheckoutPageWithFullCart = async (locale, itemCount = 1) => {
    await this.addProductToCart(locale, itemCount);
    await this.successMessage.waitFor({ visible: true });

    await this.navigateToCheckout(locale);
    if (this.consentButton.isVisible()) {
		this.consentButton.click();
	  }
    await this.checkoutGuest.click();
  };

  getCheckoutUrl(locale) {
    return `/on/demandware.store/Sites-RefArch-Site/${locale}/Checkout-Login`;
  };

  getCartUrl(locale) {
    return `/s/RefArch/cart?lang=${locale}`;
  };

  addProductToCart = async (locale, itemCount = 1) => {
    await this.consentButton.click();
    await this.page.goto(`/s/RefArch/25599638M.html?lang=${locale}`);
    if (itemCount > 1) {
      await this.selectQuantity.selectOption({ index: itemCount });
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

    await this.checkoutPageUserTelephoneInput.type(shopperDetails.telephone);

    if (await this.checkoutPageUserStateSelect.isVisible()) {
      await this.checkoutPageUserStateSelect.selectOption({ index: 1 })
      if (shopperDetails.address.stateOrProvince !== '') {
        await this.checkoutPageUserStateSelect.selectOption(
          shopperDetails.address.stateOrProvince,
        );
      }
    }
    await this.submitShipping();
  };

  setEmail = async (email = 'test@adyenTest.com') => {
    await this.checkoutPageUserEmailInput.fill('');
    await this.checkoutPageUserEmailInput.fill(email);
    // Pressing Tab to simulate component re-rendering and waiting the components to re-mount
    await this.page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 2000)); 
  };

  submitShipping = async () => {
    await this.page.waitForLoadState('networkidle');
    await this.shippingSubmit.click();
    await this.page.waitForNavigation({ waitUntil: "networkidle" });

    // Ugly wait since the submit button takes time to mount.
    await new Promise(r => setTimeout(r, 2000));
  };

  submitPayment = async () => {
    await this.page.waitForLoadState('load');
    await this.submitPaymentButton.click();
  };
  placeOrder = async () => {
    await this.page.waitForLoadState('load');
    await this.placeOrderButton.click();
  };

  completeCheckoutLoggedInUser = async () => {
    await this.completeCheckout();
  };

  completeCheckout = async () => {
    await this.submitPayment();
    await this.placeOrder();
  };

  goBackAndSubmitShipping = async () => {
    await this.page.waitForNavigation('load');
    await this.navigateBack();
    await this.submitShipping();
  };

  expectSuccess = async () => {
    await this.page.waitForNavigation({
      url: /Order-Confirm/,
      timeout: 20000,
    });
    await expect(this.thankYouMessage).toBeVisible();
  };

  expectNonRedirectSuccess = async () => {
    await expect(this.thankYouMessage).toBeVisible();
  };

  expectRefusal = async () => {
    await expect(this.errorMessage).not.toBeEmpty();
  };

  expectVoucher = async () => {
    await expect(this.voucherCode).toBeVisible();
  };

  expectQRcode = async () => {
    await this.qrLoader.waitFor({ state: 'attached'});
    await expect(this.qrLoaderAmount).toBeVisible();
    await expect(this.qrImg).toBeVisible();
  };

  expectGiftCardWarning = async () => {
    await expect(this.giftCardWarning).not.toBeEmpty();
  };

  getLocation = async () => {
    await this.page.waitForLoadState('load');
    return await this.page.url();
  };

  navigateBack = async () => {
    await this.page.waitForLoadState('networkidle');
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle');
  };

  loginUser = async (credentials) => {
    await this.signInSectionButton.click();
    await this.emailField.type(credentials.shopperEmail);
    await this.passwordField.type(credentials.password);
    await this.loginButton.click();
    await this.page.waitForNavigation({ waitUntil: 'load' });
  };

  makeSuccessfulDonation = async () => {
    await this.donationAmountButton.click();
    await this.donationButton.click();
    await expect(this.givingThankyouMessage).toContainText(
      'Thanks for your support',
    );
  };
}
