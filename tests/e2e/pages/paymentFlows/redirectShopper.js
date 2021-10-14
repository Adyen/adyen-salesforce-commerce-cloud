import {Selector, t} from "testcafe";

const idealRadioButton = Selector('#rb_ideal');
const iDealInput = Selector('input[value="ideal"]');
const iDealDropDown = Selector('#component_ideal .adyen-checkout__dropdown__button');
const iDealDropDownList = Selector('#component_ideal .adyen-checkout__dropdown__list');
const iDealDropDownListElement = Selector('#component_ideal .adyen-checkout__dropdown__list li');
const iDealContinueButtonOnHPP = Selector('input[type="submit"]');
const submitPaymentButton = Selector('.submit-payment');
const placeOrderButton = Selector('.place-order');
const checkoutPageUserEmailInput = Selector('#email');

const submitPayment = async () => {
    await t
        .click(submitPaymentButton);
}
const placeOrder = async () => {
    await t
        .click(placeOrderButton);
}

const continueOnHPP = async () => {
    await t
        .click(iDealContinueButtonOnHPP);
}

const setEmail = async () => {
    await t
        .typeText(checkoutPageUserEmailInput, 'wally@bizzle.com');
}

const ideal = async () => {
    await t
        .click(idealRadioButton)
        .click(iDealInput)
        .click(iDealDropDown)
        .click(iDealDropDownListElement);
    await setEmail();
    await submitPayment();
    await placeOrder();
    await continueOnHPP();
}

module.exports = {
    ideal,
}
