import { test } from '@playwright/test';
import { RedirectShopper } from '../paymentFlows/redirectShopper.mjs';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { ShopperData } from '../data/shopperData.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} NOK`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.NO);
      await checkoutPage.setShopperDetails(shopperData.NO);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('Vipps Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doVippsPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeVippsRedirect(true);
      // can only be tested up to redirect. No success assertion
    });

    test('Vipps Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doVippsPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeVippsRedirect(false);
      await checkoutPage.expectRefusal();
    });

    // Skipping Trustly due to instable sandbox
    test.skip('Trustly Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doTrustlyPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeTrustlyRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test.skip('Trustly Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doTrustlyPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeTrustlyRedirect(false);
      await checkoutPage.expectRefusal();
    });
  });
}
