import {ClientFunction, Selector, t} from "testcafe";

export default class checkout {
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

    goToCheckoutPageWithFullCart = async () => {
        await this.addProductToCart();
        await this.successMessage();

        await t
            .navigateTo(this.checkoutUrl)
            .click(this.checkoutGuest);
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
            .typeText(this.checkoutPageUserTelephoneInput, shopperDetails.telephone)
            // .click(this.checkoutPageUserStateSelect)
            // .click(this.checkoutPageUserStateSelectOption.sibling(1));
    }

    goToPaymentsPage = async () => {
        await t
            .click(this.shippingSubmit);
    }

    expectSuccess = async () => {
        await t
            .expect(this.getLocation()).contains('Order-Confirm');
    }

    getLocation = ClientFunction(() => document.location.href);

}
