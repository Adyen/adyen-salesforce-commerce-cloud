import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { environments } from '../../data/environments.mjs';

let redirectShopper;
let checkoutPage;
const shopperData = new ShopperData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR AT`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.AT);
      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });
    test('EPS Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doEPSPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeEPSRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('EPS Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doEPSPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeEPSRedirect(false);
      await checkoutPage.expectRefusal();
    });
  });
}
