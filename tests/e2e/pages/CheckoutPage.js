import {ClientFunction, Selector, t} from "testcafe";

export default class CheckoutPage {

    consentButton = Selector('.affirm');
    categoryLink = Selector('.home-main-categories .category-tile');
    productCard = Selector('.product .image-container a');
    colourSelector = Selector('.color-attribute');
    selectSize = Selector('.select-size');
    sizeOption = this.selectSize.find('option');
    addToCartButton = Selector('.add-to-cart');
    successMessage = Selector('.add-to-cart-messages');
    checkoutUrl = '/on/demandware.store/Sites-RefArch-Site/fr_FR/Checkout-Login';
    checkoutGuest = Selector('.checkout-as-guest')

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

    shippingSubmit = Selector('.submit-shipping');

    submitPaymentButton = Selector('.submit-payment');
    placeOrderButton = Selector('.place-order');
    checkoutPageUserEmailInput = Selector('#email');

    errorMessage = Selector('.error-message-text');

    goToCheckoutPageWithFullCart = async (locale) => {
        await this.addProductToCart();
        await this.successMessage();

        await t
            .navigateTo(this.getCheckoutUrl(locale))
            .click(this.checkoutGuest);
    }

    getCheckoutUrl(locale){
        return `/on/demandware.store/Sites-RefArch-Site/${locale}/Checkout-Login`;
    }

    addProductToCart = async () => {
        await t
            .click(this.consentButton)
            .click(this.categoryLink)
            .click(this.productCard)
            .click(this.colourSelector)
            .click(this.selectSize)
            .click(this.sizeOption.withText('4'))
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
                .click(this.checkoutPageUserStateSelectOption.withAttribute('id', shopperDetails.address.stateOrProvince));

        }
        await t.click(this.shippingSubmit);
    }

    setEmail = async () => {
        await t
            .typeText(this.checkoutPageUserEmailInput, 'wally@bizzle.com');
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
        await this.setEmail();
        await this.submitPayment();
        await this.placeOrder();
    }

    expectSuccess = async () => {
        await t
            .expect(this.getLocation()).contains('Order-Confirm')
            .expect(Selector('.order-thank-you-msg').exists).ok();
    }

    expectRefusal = async () => {
        await t
            .expect(this.errorMessage.innerText).notEql('');
    }

    getLocation = ClientFunction(() => document.location.href);

}
