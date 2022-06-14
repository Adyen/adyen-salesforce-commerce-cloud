import { expect } from '@playwright/test';
export default class AccountPageSFRA {
  constructor(page) {
    this.page = page;
    this.consentButton = page.locator('.affirm');
  }

  consent = async () => {
    await this.consentButton.click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page
      .locator('.adyen-checkout__card__holderName__input')
      .type(cardInput.holderName);
    await this.page
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field')
      .type(cardInput.cardNumber);
    await this.page
      .frameLocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field')
      .type(cardInput.expirationDate);

    if (cardInput.cvc !== '') {
      await this.page
        .frameLocator('.adyen-checkout__card__cvc__input iframe')
        .locator('.input-field')
        .type(cardInput.cvc);
    }
    await this.page.click('button[name="save"]');
  };

  addCard = async (cardData) => {
    await this.page.click('a[href$="PaymentInstruments-AddPayment"]');
    await this.initiateCardPayment(cardData);
  };

  removeCard = async () => {
    await this.page.goto('/s/RefArch/wallet');

    await this.page.click('.remove-btn');
    await this.page.click('.delete-confirmation-btn');
  };

  expectSuccess = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    const cardElement = this.savedCardElementGenerator(last4);

    await cardElement.waitFor({
      state: 'visible',
      timeout: 3000,
    });
  };

  expectFailure = async () => {
    await expect(await this.page.locator('.alert-danger')).toBeVisible();
  };

  expectCardRemoval = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    const cardElement = this.savedCardElementGenerator(last4);

    await cardElement.waitFor({
      state: 'detached',
      timeout: 3000,
    });
  };

  savedCardElementGenerator = (cardNumber) => {
    let locatorText = `//*[@class="card"]//p[contains(text(),"${cardNumber}")]`;
    return this.page.locator(locatorText);
  };
}
