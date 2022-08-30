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
      await redirectShopper.doBillDeskPayment('billdesk_upi');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('UPI Failure', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doBillDeskPayment('billdesk_upi');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(false);
      await checkoutPage.expectRefusal();
    });

    test('Wallet Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doBillDeskPayment('billdesk_wallet');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('Wallet Failure', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doBillDeskPayment('billdesk_wallet');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(false);
      await checkoutPage.expectRefusal();
    });

    test('Billdesk Online Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doBillDeskPayment('billdesk_online');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('Billdesk Online Failure', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doBillDeskPayment('billdesk_online');
      await checkoutPage.completeCheckout();
      await redirectShopper.completeBillDeskRedirect(false);
      await checkoutPage.expectRefusal();
    });
  });
}
