import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { PresentToShoppers } from '../../paymentFlows/presentToShopper.mjs';
import { PendingPayments } from '../../paymentFlows/pending.mjs';
import { ShopperData } from '../../data/shopperData.mjs';

let pendingPayments;
let presentToShoppers;
let checkoutPage;
const shopperData = new ShopperData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR PT`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.PT);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('MultiBanco Success', async ({ page }) => {
      presentToShoppers = new PresentToShoppers(page);

      await presentToShoppers.doMultiBancoPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    /* - MBWay redirection is too flaky
     - The country code is added to the beginning of phone number
      even if it's written */
    test.fixme('MBWay Success', async ({ page }) => {
      pendingPayments = new PendingPayments(page);

      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await pendingPayments.doMBWayPayment();
      await checkoutPage.completeCheckout();

      await pendingPayments.waitForThirdPartyPaymentLoader();
      await checkoutPage.expectSuccess();
    });
  });
}
