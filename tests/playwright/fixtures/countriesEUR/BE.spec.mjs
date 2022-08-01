import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { environments } from '../../data/environments.mjs';
import { PendingPayments } from '../../paymentFlows/pending.mjs';

let pendingPayments;
let checkoutPage;
const shopperData = new ShopperData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR BE`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.BE);
    });
    test('bcmc mobile renders', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      if (environment.name === 'SG') await checkoutPage.setEmail();
      await pendingPayments.doQRCodePayment('bcmc_mobile', environment.name);
      if (environment.name != 'SG') await checkoutPage.completeCheckout();
      await checkoutPage.expectQRcode();
    });
  });
}
