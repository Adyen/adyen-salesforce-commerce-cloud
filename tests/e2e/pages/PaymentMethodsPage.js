import {Selector, t} from "testcafe";

export default class PaymentMethodsPage {

    initiateIdealPayment = async (testSuccess) => {
        const iDealInput = Selector('input[value="ideal"]');
        const iDealDropDown = Selector('#component_ideal .adyen-checkout__dropdown__button');
        const issuer = testSuccess ? Selector('#component_ideal .adyen-checkout__dropdown__list li') : Selector('#component_ideal li[data-value="1160"]');

        await t
            .click(Selector('#rb_ideal'))
            .click(iDealInput)
            .click(iDealDropDown)
            .click(issuer);
    }

    submitIdealSimulator = async () => {
        await t
            .click(Selector('input[type="submit"]'));
    }

    initiateOneyPayment = async (shopper) => {
        const oneyGender = Selector('#component_facilypay_4x input[value="MALE"]');
        const oneyDateOfBirth = Selector('#component_facilypay_4x .adyen-checkout__input--dateOfBirth');
        const oneyEmail = Selector('#component_facilypay_4x input[name="shopperEmail"]');

        await t
            .click(Selector('#rb_facilypay_4x'))
            .click(oneyGender)
            .click(oneyDateOfBirth)
            .typeText(oneyDateOfBirth, shopper.dateOfBirth)
            .typeText(oneyEmail, shopper.shopperEmail)
    }

    confirmOneyPayment = async () => {
        //Simulation on the Oney page
    }

    initiateKlarnaPayment = async (klarnaVariant) => {
        let klarnaSelector = Selector('#rb_klarna');
        if(klarnaVariant){
            klarnaSelector = klarnaVariant == 'paynow' ? Selector('#rb_klarna_paynow') : Selector('#rb_klarna_account');
        }
        await t
            .click(klarnaSelector)
    }

    confirmKlarnaAccountPayment = async () => {
        await Selector('#payment-method-selector')();
        await t
            .click(Selector('#buy-button'))
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText(Selector('input[name="dateOfBirth"]'), '01011991')
            .click(Selector('button').withAttribute('id', /continue/))
            .switchToMainWindow()
    }

    confirmKlarnaPayNowPayment = async () => {
        //confirm
    }

    confirmKlarnaPayment = async () => {
        //confirm
    }

    cancelKlarnaPayment = async () => {
        //click return button
    }

    confirmGiropayPayment = async () => {

    }

    cancelGiropayPayment = async () => {
        //verify selectors
        await t
            .click(Selector('#backUrl'))
            .click(Selector('modal #confirm'))
    }

    confirmEPSPayment = async () => {

    }

    cancelEPSPayment = async () => {

    }

    confirmAffirmPayment = async () => {

    }

    cancelAffirmPayment = async () => {

    }

}