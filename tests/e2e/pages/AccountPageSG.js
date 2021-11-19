import {ClientFunction, Selector, t} from "testcafe";

export default class AccountPageSG {
  consentButton = Selector('.ui-dialog-buttonset button:first-child');
  savedCard = Selector('.cc-number');

  consent = async () => {
    await t.click(this.consentButton)
  }

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
    await t.click('#applyBtn');
  }

  addCard = async (cardData) => {
    await t
        .navigateTo(`/s/SiteGenesis/wallet`)
        .expect(Selector('.card-error').visible).notOk()
        .click('.add-card')
    await this.initiateCardPayment(cardData);
  }

  removeCard = async () => {
    await t
        .navigateTo(`/s/SiteGenesis/wallet`)
        .setNativeDialogHandler(() => true)
        .click('.delete')
  }

  expectSuccess = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    await t.expect(this.savedCard.withText(last4).exists).ok();
  }

  getLocation = ClientFunction(() => document.location.href);

  expectFailure = async () => {
    await t.expect(Selector('.card-error').visible).ok();
  }

  expectCardRemoval = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    await t .expect(this.savedCard.withText(last4).exists).notOk();;
  }

}
