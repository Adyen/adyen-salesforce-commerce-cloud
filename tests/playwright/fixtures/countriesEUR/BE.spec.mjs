import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { environments } from '../../data/environments.mjs';
import { PendingPayments } from '../../paymentFlows/pending.mjs';
import { Cards } from '../../paymentFlows/cards.mjs';
import { CardData } from '../../data/cardData.mjs';

let pendingPayments;
let checkoutPage;
let cards;
const shopperData = new ShopperData();
const cardData = new CardData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR BE`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      cards = new Cards(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.BE);
      // SFRA 6 email setting flow is different
      if (environment.name.indexOf('v6') === -1) {
        await checkoutPage.setEmail();
      };
    });
    test('bcmc mobile renders', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      await pendingPayments.doQRCodePayment('bcmc_mobile', environment.name);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectQRcode();
    });
    test('bcmc mobile cancellation flow', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      await pendingPayments.doQRCodePayment('bcmc_mobile', environment.name);
      await checkoutPage.completeCheckout();
      await pendingPayments.cancelQRCodePayment();
    });

    test('Card co-branded BCMC payment success', async () => {
      await cards.doCardPayment(cardData.coBrandedBCMC);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('Card co-branded BCMC payment failure', async () => {
      const cardDataInvalid = Object.assign({}, cardData.coBrandedBCMC);
      cardDataInvalid.expirationDate = '0150';
      await cards.doCardPayment(cardDataInvalid);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectRefusal();
    });
  });
}
