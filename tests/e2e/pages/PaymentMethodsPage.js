import {Selector, t} from "testcafe";

const shopperData = require("../data/shopperData.json");
const cardData = require("../data/cardData.json");

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

    billdeskSimulator = async (result) => {
        const select = Selector('#BankStatus');
        const option = select.find("option");
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

    initiateQRCode = async (paymentMethod) => {
        await t
            .click(Selector(`#rb_${paymentMethod}`))
            .click(Selector(`#component_${paymentMethod} button`))
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
            .typeText(nameInput, cardData.sepaUser.accountName)
            .typeText(ibanInput, cardData.sepaUser.iban)
    }

    initiateBankTransferPayment = async () => {
        await t
            .click(Selector('#rb_bankTransfer_NL'))
    }

    initiateKonbiniPayment = async () => {
        await t
            .click(Selector('#rb_econtext_stores'))
            .typeText(Selector('input[name="econtext.shopperEmail"]'), shopperData.JP.shopperEmail);
    }
}
