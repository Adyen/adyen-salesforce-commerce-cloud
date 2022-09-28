import {ClientFunction, Selector, t} from "testcafe";

export default class CheckoutPageSFRA {

  consentButton = Selector('.affirm');
  categoryLink = Selector('.home-main-categories .category-tile');
  productCard = Selector('.product .image-container a');
  colourSelector = Selector('.color-attribute');
  selectSize = Selector('.select-size');
  sizeOption = this.selectSize.find('option');
  addToCartButton = Selector('.add-to-cart');
  successMessage = Selector('.add-to-cart-messages');
  checkoutUrl = '/on/demandware.store/Sites-RefArch-Site/fr_FR/Checkout-Login';
  checkoutGuest = Selector('.submit-customer')

  loginUrl = '/customer/account';
  emailInput = Selector('#email');
  passwordInput = Selector('#pass');
  submitButton = Selector('#send2');
  customerAccountPage = Selector('.account.customer-account-index');

  checkoutPageUserEmailInput = Selector('input[name="loginEmail"]');
  checkoutPageUserPasswordInput = Selector('input[name="loginPassword"]');
  checkoutPageLoginButton = Selector('.login button[type="submit"]');

  checkoutPageUserFirstNameInput = Selector('#shippingFirstNamedefault');
  checkoutPageUserLastNameInput = Selector('#shippingLastNamedefault');
  checkoutPageUserStreetInput = Selector('#shippingAddressOnedefault');
  checkoutPageUserHouseNumberInput = Selector('#shippingAddressTwodefault');
  checkoutPageUserCityInput = Selector('#shippingAddressCitydefault');
  checkoutPageUserPostCodeInput = Selector('#shippingZipCodedefault');
  checkoutPageUserCountrySelect = Selector('#shippingCountrydefault');
  checkoutPageUserCountrySelectOption = this.checkoutPageUserCountrySelect.find('option');
  checkoutPageUserStateSelect = Selector('#shippingStatedefault');
  checkoutPageUserStateSelectOption = this.checkoutPageUserStateSelect.find('option');
  checkoutPageUserTelephoneInput = Selector('#shippingPhoneNumberdefault');
  checkoutPageGuestEmailInput = Selector('#email-guest');

  shippingSubmit = Selector('.submit-shipping');

  submitPaymentButton = Selector('.submit-payment');
  placeOrderButton = Selector('.place-order');
  checkoutPageUserEmailInput = Selector('#email');

  errorMessage = Selector('.error-message-text');

  navigateToCheckout = async (locale) => {
    await t.navigateTo(this.getCheckoutUrl(locale));
  }

  goToCheckoutPageWithFullCart = async (locale) => {
    await this.addProductToCart(locale);
    await this.successMessage();

    await this.navigateToCheckout(locale);
  }

  getCheckoutUrl(locale){
    return `/on/demandware.store/Sites-RefArch-Site/${locale}/Checkout-Begin`;
  }

  addProductToCart = async (locale) => {
    await t
        .click(this.consentButton)
        .navigateTo(`/s/RefArch/25720033M.html?lang=${locale}`)
        .click(this.addToCartButton);
  }

  setShopperDetails = async (shopperDetails) => {
    await t
        .typeText(this.checkoutPageGuestEmailInput, shopperDetails.shopperEmail)
        .click(this.checkoutGuest)

        .typeText(this.checkoutPageUserFirstNameInput, shopperDetails.shopperName.firstName)
        .typeText(this.checkoutPageUserLastNameInput, shopperDetails.shopperName.lastName)
        .typeText(this.checkoutPageUserStreetInput, shopperDetails.address.street)
        .typeText(this.checkoutPageUserHouseNumberInput, shopperDetails.address.houseNumberOrName)
        .typeText(this.checkoutPageUserCityInput, shopperDetails.address.city)
        .typeText(this.checkoutPageUserPostCodeInput, shopperDetails.address.postalCode)
        .click(this.checkoutPageUserCountrySelect)
        .click(this.checkoutPageUserCountrySelectOption.withAttribute('value', shopperDetails.address.country))
        .typeText(this.checkoutPageUserTelephoneInput, shopperDetails.telephone);
    if(shopperDetails.address.stateOrProvince !== "") {
      await t
          .click(this.checkoutPageUserStateSelect)
          .click(this.checkoutPageUserStateSelectOption.withAttribute('id', shopperDetails.address.stateOrProvince));

    }
    await t.click(this.shippingSubmit);
  }

  setEmail = async () => {
    await t
        .typeText(this.checkoutPageUserEmailInput, 'test@adyenTest.com');
  }

  submitShipping =  async () => {
    await t
        .click(this.shippingSubmit);
  }

  submitPayment = async () => {
    await t
        .click(this.submitPaymentButton);
  }
  placeOrder = async () => {
    await t
        .click(this.placeOrderButton);
  }

  completeCheckout = async () => {
    await this.submitPayment();
    await this.placeOrder();
  }

  goBackAndSubmitShipping = async () => {
    await this.navigateBack();
    await this.submitShipping();
  }

  goBackAndReplaceOrderDifferentWindow = async () => {
    const checkoutLocation = await this.getLocation();
    await this.placeOrder();
    await t
        .openWindow(checkoutLocation)
        .switchToPreviousWindow();
  }

  expectSuccess = async () => {
    await t
        .expect(this.getLocation()).contains('Order-Confirm')
        .expect(Selector('.order-thank-you-msg', { timeout: 60000 }).exists).ok();
  }

  expectRefusal = async () => {
    await t
        .expect(this.errorMessage.innerText).notEql('');
  }

  expectVoucher = async () => {
    const voucherExists = Selector('#voucherResult').exists;
    await t
        .expect(voucherExists).ok();
  }

  expectQRcode = async () => {
    const amount = Selector('.adyen-checkout__qr-loader__payment_amount').exists;
    const img = Selector('img').exists;
    await t
        .expect(amount).ok()
        .expect(img).ok()
  }

  getLocation = ClientFunction(() => document.location.href);
  navigateBack = ClientFunction( () => window.history.back());

  loginUser = async (credentials) => {
    await t
        .click('.fa-sign-in')
        .typeText('#login-form-email', credentials.shopperEmail)
        .typeText('#login-form-password', credentials.password)
        .click('.login button[type="submit"]')
  }

}
