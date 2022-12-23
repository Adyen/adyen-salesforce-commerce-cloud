import { expect } from '@playwright/test';

export default class AccountPageSG {
  constructor(page) {
    this.page = page;
    this.consentButton = page.locator(
      '.ui-dialog-buttonset button:first-child',
    );
  }

  consent = async () => {
    await this.consentButton.click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page.waitForLoadState('load', { timeout: 15000 });

    await this.page
      .locator('.adyen-checkout__card__holderName__input')
      .fill(cardInput.holderName);

    const cardNumberInputField = this.page
      .frameLocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field');
    await cardNumberInputField.click();
    await cardNumberInputField.fill(cardInput.cardNumber);

    const expirationDateInputField = this.page
      .frameLocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field');
    await expirationDateInputField.click();
    await expirationDateInputField.fill(cardInput.expirationDate);

    if (cardInput.cvc !== '') {
      const cvcInputField = this.page
        .frameLocator('.adyen-checkout__card__cvc__input iframe')
        .locator('.input-field');
      await cvcInputField.click();
      await cvcInputField.fill(cardInput.cvc);
    }

    await this.page.locator('#applyBtn').click();
  };

  addCard = async (cardData) => {
    await this.page.goto('/s/SiteGenesis/wallet');

    const errorMessage = this.page.locator('.card-error');
    await expect(errorMessage).toBeHidden();
    await this.page.locator('.add-card').click();

    await this.initiateCardPayment(cardData);
    await this.page.waitForLoadState('load', { timeout: 15000 });
  };

  removeCard = async (cardData) => {
    const deleteButton = this.page.locator(
      `${this.savedCard(cardData)}/..//button[contains(@class,'delete')]`,
    );

    this.page.on('dialog', (dialog) => dialog.accept());
    await deleteButton.click();
    await this.page.waitForLoadState('load', { timeout: 15000 });
  };

  expectSuccess = async (cardData) => {
    await this.page.waitForLoadState('load', { timeout: 15000 });
    await expect(
      await this.page.locator(this.savedCard(cardData)),
    ).toBeVisible();
  };

  expectFailure = async () => {
    await this.page.waitForLoadState('load', { timeout: 15000 });
    await expect(this.page.locator('.card-error')).toBeVisible();
  };

  expectCardRemoval = async (cardData) => {
    await this.page.waitForLoadState('load', { timeout: 15000 });
    const cardElement = this.page.locator(this.savedCard(cardData));
    await cardElement.waitFor({
      state: 'detached',
      timeout: 15000,
    });
  };

  savedCard = (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    const savedCardLocator = `//div[@class='cc-number' and contains(text(),'**${last4}')]`;
    return savedCardLocator;
  };
}
