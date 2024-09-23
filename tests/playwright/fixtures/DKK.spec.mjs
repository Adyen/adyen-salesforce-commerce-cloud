import { test } from '@playwright/test';
import { RedirectShopper } from '../paymentFlows/redirectShopper.mjs';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { ShopperData } from '../data/shopperData.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} DKK`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.DK);
      await checkoutPage.setShopperDetails(shopperData.DK);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test.skip('MobilePay', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doMobilePayPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeMobilePayRedirect();
      // can only be tested up to redirect. No success assertion
    });
  });
}
