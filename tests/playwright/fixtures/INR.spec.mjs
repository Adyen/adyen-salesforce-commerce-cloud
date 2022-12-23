import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { RedirectShopper } from '../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../data/shopperData.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} INR`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.IN);
      await checkoutPage.setShopperDetails(shopperData.IN);
    });

    test('UPI Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doUPIPayment('upi_collect');
      await checkoutPage.completeCheckout();
      await checkoutPage.isPaymentModalShown("upi_collect");
    });

    test('UPI Failure', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doUPIPayment('upi_collect', false);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectRefusal();
    });

    test('UPI QR Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doUPIPayment('upi_qr');
      await checkoutPage.completeCheckout();
      await checkoutPage.isPaymentModalShown("upi_qr");
    });
  });
}
