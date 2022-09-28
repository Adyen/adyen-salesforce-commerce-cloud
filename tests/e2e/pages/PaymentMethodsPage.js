import {Selector, t, ClientFunction} from "testcafe";

const shopperData = require("../data/shopperData.json");
const paymentData = require("../data/paymentData.json");

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

    initiateBillDeskPayment = async (paymentMethod) => {
        await t
            .click(Selector(`#rb_${paymentMethod}`))
        if(paymentMethod === "billdesk_upi") {
            return;
        }
        const input = Selector(`input[value="${paymentMethod}"]`);
        const dropDown = Selector(`#component_${paymentMethod} .adyen-checkout__dropdown__button`);
        const issuer = Selector(`#component_${paymentMethod} .adyen-checkout__dropdown__list li`);
        await t
            .click(input)
            .click(dropDown)
            .click(issuer);
    }

    billdeskSimulator = async (success) => {
        const select = Selector('#BankStatus');
        const option = select.find("option");
        const result = success ? "Success" : "Failure";
            await t
                .click(select)
                .click(option.withText(`${result}`))
                .click(Selector('#SubmitForm'))
    }

    submitSimulator = async () => {
        await t
            .click(Selector('input[type="submit"]'));
    }

    initiateCardPayment = async (cardInput) => {
        await t
            .click(Selector('#rb_scheme'))
            .typeText(Selector('.adyen-checkout__card__holderName__input'), cardInput.holderName)
            .switchToIframe('.adyen-checkout__card__cardNumber__input iframe')
            .typeText('.input-field', cardInput.cardNumber)
            .switchToMainWindow()
            .switchToIframe('.adyen-checkout__card__exp-date__input iframe')
            .typeText('.input-field', cardInput.expirationDate)
            .switchToMainWindow();
        if(cardInput.cvc !== "") {
            await t
                .switchToIframe('.adyen-checkout__card__cvc__input iframe')
                .typeText('.input-field', cardInput.cvc)
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
                .typeText('input[data-fieldtype="encryptedSecurityCode"]', oneClickCardInput.cvc)
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
            .click('button[type="submit"]')
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

    confirmKlarnaPayNowPayment = async () => {
        const ibanSelector = Selector('#iban');
        await Selector('#payment-method-selector')();
        await t
            .click('#buy-button')
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText('#addressCollector-date_of_birth', '01011991')
            .click('#dd-identification-dialog__footer-button-wrapper button');
        if(await ibanSelector.exists) {
            await t
                .typeText(ibanSelector, 'DE11520513735120710131')
                .click('#aligned-content__button__0');
        }
        await t
            .click('#aligned-content__button__0')
            .switchToMainWindow();
    }

    confirmKlarnaAccountPayment = async () => {
        await Selector('#payment-method-selector')();
        await t
            .click('#buy-button')
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText('#baseaccount_kp-purchase-approval-form-date-of-birth', '01011991')
            .click('#baseaccount_kp-purchase-approval__bottom')
            .switchToMainWindow()
    }

    confirmKlarnaPayment = async () => {
        await Selector('#payment-method-selector')();
        await t
            .click(Selector('#buy-button'))
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText(Selector('#invoice_kp-purchase-approval-form-date-of-birth'), '01011991')
            .click(Selector('#invoice_kp-purchase-approval-form-continue-button'))
            .switchToMainWindow()
    }

    confirmKlarnaPaymentWithIDNumber = async () => {
        await Selector('#payment-method-selector')();
        await t
            .click(Selector('#buy-button'))
            .switchToIframe('#klarna-hpp-instance-fullscreen')
            .typeText(Selector('#invoice_kp-purchase-approval-form-national-identification-number'), '811228-9874')
            .click(Selector('#invoice_kp-purchase-approval-form-continue-button'))
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
            .typeText(affirmEmail, shopper.shopperEmail, {replace: true});
    }

    confirmSimulator = async () => {
        //Confirm the simulator
    }

    cancelSimulator = async () => {
        //Cancel the simulator
    }

    cancelAffirmPayment = async () => {
        await t
            .setNativeDialogHandler(() => true)
            .click('#close-button');
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
        const secondOneTimeCode = await Selector('.message_value', { timeout: 60000 }).innerText;
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

    initiateMultiBancoPayment = async () => {
        const multibancoInput = Selector('input[value="multibanco"]');
        await t
            .click(multibancoInput)
    }

    initiateMBWayPayment = async () => {
        const mbwayInput = Selector('input[value="mbway"]');
        const mbwayButton = Selector('#component_mbway button');
        await t
            .click(mbwayInput)
            .click(mbwayButton)
    }

    initiateGooglePayPayment = async () => {
        const gButton = Selector('#component_paywithgoogle button');
        await t
            .click(Selector(`#rb_paywithgoogle`))
            .click(gButton)
    }

    initiateQRCode = async (paymentMethod, envName) => {
        await t
            .click(Selector(`#rb_${paymentMethod}`))
        if(envName === "SG") {
            await t
                .click(Selector(`#component_${paymentMethod} button`))
        }
    }

    initiateBoletoPayment = async () => {
        const socialSecurityInput = Selector('input[name="socialSecurityNumber"]');
        await t
            .click(Selector('#rb_boletobancario'))
            .typeText(socialSecurityInput, "56861752509")
    }

    MultiBancoVoucherExists = async () => {
        return Selector('.adyen-checkout__voucher-result--multibanco').exists;
    }

    initiateSEPAPayment = async () => {
        const nameInput = Selector('input[name="sepa.ownerName"]');
        const ibanInput = Selector('input[name="sepa.ibanNumber"]');

        await t
            .click(Selector('#rb_sepadirectdebit'))
            .typeText(nameInput, paymentData.SepaDirectDebit.accountName)
            .typeText(ibanInput, paymentData.SepaDirectDebit.iban)
    }

    initiateBankTransferPayment = async () => {
        await t
            .click(Selector('#rb_bankTransfer_NL'))
    }

    initiateKonbiniPayment = async () => {
        await t
            .click(Selector('#rb_econtext_stores'))
            .typeText(Selector('input[name="econtext.shopperEmail"]'), shopperData.JP.shopperEmail, {replace: true})
            .typeText(Selector('input[name="econtext.telephoneNumber"]'), '3333333333', {replace: true});
    }
}
