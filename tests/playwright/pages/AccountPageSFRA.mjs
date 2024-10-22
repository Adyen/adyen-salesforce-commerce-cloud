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
    await this.page.waitForLoadState('networkidle');
    await this.page.click('button[name="save"]');
  };

  addCard = async (cardData) => {
    await this.page.click('a[href$="PaymentInstruments-AddPayment"]');
    await this.initiateCardPayment(cardData);
  };

  removeCard = async (cardData) => {
    const cardElement = this.savedCardElementGenerator(cardData);
    const deleteButton = cardElement.locator('../../button');

    await this.page.waitForLoadState('networkidle');

    await deleteButton.click();
    await this.page.click('.delete-confirmation-btn');
  };

  expectSuccess = async (cardData) => {
    const cardElement = this.savedCardElementGenerator(cardData);

    await cardElement.waitFor({
      state: 'visible',
    });
  };

  expectFailure = async () => {
    await expect(await this.page.locator('.alert-danger')).toBeVisible();
  };

  expectCardRemoval = async (cardData) => {
    const cardElement = this.savedCardElementGenerator(cardData);

    await cardElement.waitFor({
      state: 'detached',
    });
  };

  savedCardElementGenerator = (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    const locatorText = `//*[@class="card"]//p[contains(text(),"**${last4}")]`;
    return this.page.locator(locatorText);
  };
}
