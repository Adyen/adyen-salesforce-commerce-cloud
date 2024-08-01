import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { PendingPayments } from '../paymentFlows/pending.mjs';

import { RedirectShopper } from '../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../data/shopperData.mjs';
import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';

const shopperData = new ShopperData();
let checkoutPage;
let pendingPaymentsPage;
let redirectPaymentsPage;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} SEK`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.SE);
      await checkoutPage.setShopperDetails(shopperData.SE);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });
    test('Swish success', async ({ page }) => {
      pendingPaymentsPage = new PendingPayments(page);

      await pendingPaymentsPage.doQRCodePayment('swish', environment.name);
      if (environment.name.includes('SFRA'))
        await checkoutPage.completeCheckout();
      await checkoutPage.expectQRcode();
    });

    test('Klarna Success', async ({ page }) => {
      redirectPaymentsPage = new RedirectShopper(page);

      await redirectPaymentsPage.doKlarnaPayment();
      await checkoutPage.completeCheckout();
      await new PaymentMethodsPage(page).waitForKlarnaLoad();
    });
  });
}
