import { expect } from '@playwright/test';
export default class AccountPageSFRA {
  constructor(page) {
    this.page = page;
    this.consentButton = page.locator('.affirm');
    this.savedCard = page.locator('.card p:nth-child(2)');
  }

  consent = async () => {
    await this.consentButton.click();
  };

  initiateCardPayment = async (cardInput) => {
    await this.page
      .locator('.adyen-checkout__card__holderName__input')
      .type(cardInput.holderName);
    await this.page
      .framelocator('.adyen-checkout__card__cardNumber__input iframe')
      .locator('.input-field')
      .type(cardInput.cardNumber);
    await this.page
      .framelocator('.adyen-checkout__card__exp-date__input iframe')
      .locator('.input-field')
      .type(cardInput.expirationDate);

    if (cardInput.cvc !== '') {
      await this.page
        .framelocator('.adyen-checkout__card__cvc__input iframe')
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
    expect(await this.savedCard.innerText()).toContain(last4);
  };

  expectFailure = async () => {
    await expect(await this.page.locator('.card-error')).toBeVisible();
  };

  expectCardRemoval = async (cardData) => {
    const last4 = cardData.cardNumber.slice(-4);
    expect(await this.savedCard.innerText()).not.toContain(last4);
  };
}
