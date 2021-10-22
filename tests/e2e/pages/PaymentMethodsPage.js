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
}
