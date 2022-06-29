import { expect } from '@playwright/test';

export default class AccountPageSG {
  constructor(page) {
    this.page = page;
    this.consentButton = page.locator(
      '.ui-dialog-buttonset button:first-child',
    );
    this.savedCard = page.locator('.cc-number');
  }

  consent = async () => {
    await this.consentButton.click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page.waitForLoadState('load', { timeout: 10000 });

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
  };

  removeCard = async () => {
    await this.page.goto('/s/SiteGenesis/wallet');
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.click('.delete');
  };

  expectSuccess = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    expect(await this.savedCard.innerText()).toContain(last4);
  };

  expectFailure = async () => {
    await expect(this.page.locator('.card-error')).toBeVisible();
  };

  expectCardRemoval = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    expect(await this.savedCard.innerText()).not.toContain(last4);
  };
}
