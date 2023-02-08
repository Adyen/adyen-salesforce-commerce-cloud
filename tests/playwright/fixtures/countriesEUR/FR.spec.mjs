import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { Cards } from '../../paymentFlows/cards.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;
let cards;

for (const environment of environments) {
  // Skipping this one since Oney Redirection is broken on sandboxes
  test.describe.skip(`${environment.name} EUR FR`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.FR);
      cards = new Cards(page);
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

test.describe.parallel(`${environment.name} EUR FR`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
      cards = new Cards(page);
   });

   test('No 3DS Amazon Pay', async ({ page }) => {
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
    await checkoutPage.setShopperDetails(shopperData.FR);
    if (environment.name.indexOf('v6') === -1) {
      await checkoutPage.setEmail();
    }
    redirectShopper = new RedirectShopper(page);
    await redirectShopper.doAmazonPayment();
    await checkoutPage.expectSuccess();
  });
  
  test('3DS2 Amazon Pay', async ({ page }) => {
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
    await checkoutPage.setShopperDetails(shopperData.FR);
    if (environment.name.indexOf('v6') === -1) {
      await checkoutPage.setEmail();
    }
    redirectShopper = new RedirectShopper(page);
    await redirectShopper.doAmazonPayment(true, true, '3ds2_card');
    await cards.do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test.skip('Amazon Pay Express', async ({ page }) => {
    redirectShopper = new RedirectShopper(page);
    await checkoutPage.addProductToCart();
    await checkoutPage.navigateToCart(regionsEnum.EU);
    await redirectShopper.doAmazonPayment(false);
    await redirectShopper.doAmazonExpressPayment();
    await checkoutPage.expectSuccess();
  });

  test('Amazon Pay Failure', async ({ page }) => {
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
    await checkoutPage.setShopperDetails(shopperData.FR);
    if (environment.name.indexOf('v6') === -1) {
      await checkoutPage.setEmail();
    }
    redirectShopper = new RedirectShopper(page);
    await redirectShopper.doAmazonPayment(true, false);
    await checkoutPage.expectRefusal();
  });

 });
}