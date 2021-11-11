import {ClientFunction, Selector, t} from "testcafe";

export default class AccountPage {
    consentButton = Selector('.affirm');
    categoryLink = Selector('.home-main-categories .category-tile');
    savedCard = Selector('.card p:nth-child(2)');

    initiateCardPayment = async (cardInput) => {
        await t
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
        await t.click('button[name="save"]');
    }

    addCard = async (cardData) => {
        await t
            .click('a[href$="PaymentInstruments-AddPayment"]')
        await this.initiateCardPayment(cardData);
    }

    removeCard = async () => {
        await t
            .navigateTo(`/s/RefArch/wallet`)
            .click('.remove-btn')
            .click('.delete-confirmation-btn')
    }

    expectSuccess = async (cardData) => {
        const last4 = cardData.cardNumber.slice(-4);
        await t
            .expect(this.savedCard.innerText).contains(last4);
    }

    getLocation = ClientFunction(() => document.location.href);

    expectFailure = async (cardData) => {
        const last4 = cardData.cardNumber.slice(-4);
        await t.
            expect(this.getLocation()).notContains('wallet')
            .navigateTo(`/s/RefArch/wallet`)
            .expect(this.savedCard.innerText).notContains(last4);
    }

    expectCardRemoval = async (cardData) => {
        const last4 = cardData.cardNumber.slice(-4);
        await t
            .expect(this.savedCard.innerText).notContains(last4);
    }

}
