import {Selector, t, ClientFunction} from "testcafe";

export default class PaymentMethodsPage {

    getLocation = ClientFunction(() => document.location.href);

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

    initiateCardPayment = async (cardInput) => {
        await t
            .click(Selector('#rb_scheme'))
            .typeText(Selector('.adyen-checkout__card__holderName__input'), cardInput.holderName)
            .switchToIframe('.adyen-checkout__card__cardNumber__input iframe')
            .typeText('#encryptedCardNumber', cardInput.cardNumber)
            .switchToMainWindow()
            .switchToIframe('.adyen-checkout__card__exp-date__input iframe')
            .typeText('#encryptedExpiryDate', cardInput.expirationDate)
            .switchToMainWindow();
        if(cardInput.cvc !== "") {
            await t
                .switchToIframe('.adyen-checkout__card__cvc__input iframe')
                .typeText('#encryptedSecurityCode', cardInput.cvc)
                .switchToMainWindow();
        }

    }

    initiateOneClickPayment = async (oneClickCardInput) => {
        const cardLabelRegex = new RegExp(oneClickCardInput.oneClickLabel.replace(/[*]/g, '\\$&'));
        const oneClickLi = Selector('label').withText(cardLabelRegex).parent();
        await t.click(oneClickLi.child('input[name="brandCode"]'));
        if(oneClickCardInput.cvc !== "") {
            await t
                .switchToIframe(oneClickLi.find('iframe'))
                .typeText('#encryptedSecurityCode', oneClickCardInput.cvc)
                .switchToMainWindow();
        }
    }

    do3Ds1Verification = async () => {
        await t
            .typeText('#username', 'user')
            .typeText('#password', 'password')
            .click('.paySubmit');
    }

    do3Ds2Verification = async () => {
        await t
            .switchToIframe('.adyen-checkout__iframe')
            .typeText('.input-field', 'password')
            .click('.button--primary')
            .switchToMainWindow();
    }

    selectInstallments = async (nrInstallments) => {
        const installmentsDiv = Selector('.adyen-checkout__installments');
        await t
            .click(installmentsDiv.find('button'))
            .click(`li[data-value="${nrInstallments}"]`);
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

    confirmKlarnaPayment = async () => {
        await Selector('#payment-method-selector')();
        await t
            .click(Selector('#buy-button'))
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText(Selector('input[name="dateOfBirth"]'), '01011991')
            .click(Selector('button').withAttribute('id', /continue/))
            .switchToMainWindow()
    }

    cancelKlarnaDirectEBankingPayment = async () => {
        await t
            .click(Selector('.back-to-merchant cancel-transaction'))
            .click(Selector('#CancelTransaction'))
    }

    cancelKlarnaPayment = async () => {
        await t
            .click(Selector('#back-button'))
    }

    confirmGiropayPayment = async (giroPayData) => {
        const giroBank = Selector('#ui-id-1 li a');
        const giroBankDropdown = Selector('#tags');
        await giroBankDropdown()
        await t
            .typeText(giroBankDropdown, giroPayData.bankName)
        await giroBank()
        await t
            .click(giroBank)
            .click('input[name="continueBtn"]')
            .click('#yes')
            .typeText('input[name="sc"]', giroPayData.sc)
            .typeText('input[name="extensionSc"]', giroPayData.extensionSc)
            .typeText('input[name="customerName1"]', giroPayData.customerName)
            .typeText('input[name="customerIBAN"]', giroPayData.customerIban)
            .click('input[value="Absenden"]')
    }

    cancelGiropayPayment = async () => {
        await t
            .click(Selector('#backUrl'))
            .click(Selector('.modal-dialog #yes'))
    }

    initiateEPSPayment = async () => {
        const epsInput = Selector('input[value="eps"]');
        const epsDropDown = Selector('#component_eps .adyen-checkout__dropdown__button');
        const epsIssuer =  Selector('#component_eps .adyen-checkout__dropdown__list li');

        await t
            .click(Selector('#rb_eps'))
            .click(epsInput)
            .click(epsDropDown)
            .click(epsIssuer)
    }

    initiateAffirmPayment = async (shopper) => {
        const affirmEmail = Selector('#component_affirm input[name="shopperEmail"]');
        await t
            .click(Selector('#rb_affirm'))
            .typeText(affirmEmail, shopper.shopperEmail)
    }

    confirmSimulator = async () => {
        //Confirm the simulator
    }

    cancelSimulator = async () => {
        //Cancel the simulator
    }

    confirmAffirmPayment = async () => {
    }

    cancelAffirmPayment = async () => {

    }

    confirmVippsPayment = async () => {
        await t.expect(this.getLocation()).contains('apitest.vipps.no');
    }

    cancelVippsPayment = async () => {
        await t.click('.cancel-link');
    }

    confirmTrustlyPayment = async () => {
        await t
            .click('img[alt="DNB"]')
            .click('.button_next')
            .typeText('input[name="loginid"', 'idabarese51')
            .click('.button_next');
        const oneTimeCode = await Selector('.message_value').innerText;
        await t
            .typeText('input[type="password"]', oneTimeCode)
            .click('.button_next')
            .click('.button_next');
        const secondOneTimeCode = await Selector('.message_value').innerText;
        await t
            .typeText('input[type="password"]', secondOneTimeCode)
            .click('.button_next');
    }

    cancelTrustlyPayment = async () => {
        await t
            .click('#core_order_cancel')
            .click('.prompt-yes')
    }

    confirmMobilePayPayment = async () => {
        await t.expect(this.getLocation()).contains('sandprod-products.mobilepay.dk');
    }
}
