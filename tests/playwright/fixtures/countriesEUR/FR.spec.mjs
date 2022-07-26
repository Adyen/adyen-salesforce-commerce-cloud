import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../../data/shopperData.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;

for (const environment of environments) {
  // Skipping this one since Oney Redirection is broken on sandboxes
  test.describe.skip(`${environment.name} EUR FR`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.FR);
    });
    test('Oney Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);

      await redirectShopper.doOneyPayment(shopperData.FR);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeOneyRedirect();
      await checkoutPage.expectSuccess();
    });

    test('Oney Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);

      await redirectShopper.doOneyPayment(false);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeOneyRedirect();
      await checkoutPage.expectRefusal();
    });
  });
}
