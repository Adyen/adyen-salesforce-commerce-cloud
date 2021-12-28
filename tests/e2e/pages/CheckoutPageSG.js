import {ClientFunction, Selector, t} from "testcafe";

export default class CheckoutPageSFRA {

  consentButton = Selector('.ui-dialog-buttonset button:first-child');
  categoryTile = Selector('.category-tile');
  productCard = Selector('.name-link');
  selectSize = Selector('.swatchanchor').withText("6");
  addToCartButton = Selector('#add-to-cart');
  goToCart = Selector('.minicart-icon');
  goToCheckout = Selector('button[name="dwfrm_cart_checkoutCart"]');
  checkoutGuest = Selector('button[name="dwfrm_login_unregistered"]')
  orderConfirmationDetails = Selector('.order-confirmation-details');

  errorMessage = Selector('.error-form');
  shippingSubmit = Selector('button[name="dwfrm_singleshipping_shippingAddress_save"]')

  checkoutPageUserEmailInput = Selector('#dwfrm_billing_billingAddress_email_emailAddress');

  holderNameInput = Selector('#card .adyen-checkout__card__holderName input');
  cardNumberIFrame = Selector('.adyen-checkout__card__cardNumber__input iframe');
  cardNumberInput = Selector('#encryptedCardNumber');
  expDateIFrame = Selector('.adyen-checkout__card__exp-date__input iframe');
  expDateInput = Selector('#encryptedExpiryDate');
  cvcIFrame = Selector('.adyen-checkout__card__cvc__input iframe');
  cvcInput = Selector('#encryptedSecurityCode');

  oneClickInput = Selector('.cvc-container input.cvc-field');

  placeOrderButton = Selector('button[name="submit"]');
  submitPaymentButton = Selector('button[id="billing-submit"]');
  successMessage = Selector('.minicart-quantity').withText('1');

  checkoutPageUserFirstNameInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_firstName');
  checkoutPageUserLastNameInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_lastName');
  checkoutPageUserStreetInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_address1');
  checkoutPageUserHouseNumberInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_address2');
  checkoutPageUserCityInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_city');
  checkoutPageUserPostCodeInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_postal');
  checkoutPageUserCountrySelect = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_country');
  checkoutPageUserCountrySelectOption = this.checkoutPageUserCountrySelect.find('option');
  checkoutPageUserStateSelect = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_states_state'); //uncommented state selectors
  checkoutPageUserStateSelectOption = this.checkoutPageUserStateSelect.find('option');
  checkoutPageUserTelephoneInput = Selector('#dwfrm_singleshipping_shippingAddress_addressFields_phone');
  checkoutPageUseShippingAddressForBillingCheckBox = Selector('#dwfrm_singleshipping_shippingAddress_useAsBillingAddress');

  navigateToCheckout = async (locale) => {
    await t.navigateTo(this.getCheckoutUrl(locale));
  }

  goToCheckoutPageWithFullCart = async (locale) => {
    await this.addProductToCart(locale);
    await this.successMessage();

    await this.navigateToCheckout(locale);
    await t.click(this.checkoutGuest);
  }

  getCheckoutUrl(locale){
    return `/s/SiteGenesis/checkout?lang=${locale}`;
  }

  addProductToCart = async (locale) => {
    await t
        .click(this.consentButton)
        .navigateTo(`/s/SiteGenesis/turquoise-and-gold-hoop-earring/25720033.html?lang=${locale}`)
        .click(this.addToCartButton);
  }

  setShopperDetails = async (shopperDetails) => {
    await t
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
          .click(this.checkoutPageUserStateSelectOption.withAttribute('value', shopperDetails.address.stateOrProvince));

    }
    await t
        .click(this.checkoutPageUseShippingAddressForBillingCheckBox)
        .click(this.shippingSubmit);
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

  completeCheckoutLoggedInUser = async () => {
    await this.setEmail();
    await this.submitPayment();
    await this.placeOrder();
  }

  completeCheckout = async () => {
    await this.setEmail();
    await this.submitPayment();
    await this.placeOrder();
  }

  goBackAndSubmitPayment = async () => {
    await this.navigateBack();
    await this.submitPayment();
  }

  goBackAndReplaceOrderDifferentWindow = async () => {
    const checkoutLocation = await this.getLocation();
    await this.placeOrder();
    await t
        .openWindow(checkoutLocation)
        .switchToPreviousWindow();
  }

  expectSuccess = async () => {
    await t.expect(Selector('.confirmation-message', { timeout: 60000 }).exists).ok();
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
    const inputEmail = Selector('input').withAttribute('id', /dwfrm_login_username_.*/);
    const inputPassword = Selector('input').withAttribute('id', /dwfrm_login_password_.*/)
    await t
        .navigateTo('/s/SiteGenesis/account')
        .typeText(inputEmail, credentials.shopperEmail)
        .typeText(inputPassword, credentials.password)
        .click('button[name="dwfrm_login_login"]')
  }
}
