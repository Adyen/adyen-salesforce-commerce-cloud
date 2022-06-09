import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { doQRCodePayment } from '../paymentFlows/pending.mjs';
import {
  completeKlarnaRedirectWithIDNumber,
  doKlarnaPayment,
} from '../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../data/shopperData.mjs';
const shopperData = new ShopperData();

let checkoutPage;

for (const environment of environments) {
  test.describe(`${environment.name} SEK`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.SE);
      await checkoutPage.setShopperDetails(shopperData.SE);
    });
    test('Swish success', async ({ page }) => {
      if (environment.name === 'SG') await checkoutPage.setEmail();
      await doQRCodePayment('swish', environment.name);
      if (environment.name.includes('SFRA'))
        await checkoutPage.completeCheckout();
      await checkoutPage.expectQRcode();
    });

    test('Klarna Success', async ({ page }) => {
      await doKlarnaPayment();
      await checkoutPage.completeCheckout();
      await completeKlarnaRedirectWithIDNumber(true);
      await checkoutPage.expectSuccess();
    });
  });
}
