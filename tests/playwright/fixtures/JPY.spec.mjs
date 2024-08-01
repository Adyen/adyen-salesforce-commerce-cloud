import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { ShopperData } from '../data/shopperData.mjs';
import { PendingPayments } from '../paymentFlows/pending.mjs';

const shopperData = new ShopperData();
let checkoutPage;
let pendingPayments;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} JPY`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.JP);
      await checkoutPage.setShopperDetails(shopperData.JP);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('konbini Success', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      await pendingPayments.doKonbiniPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });
  });
}
