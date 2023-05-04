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
  test.describe(`${environment.name} EUR FR`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
      cards = new Cards(page);
    });
    test('Oney Success', async ({ page }) => {
      // Skipping the test for SFRA5
      if (environment.name.indexOf('v6') === -1) test.skip();

      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU, 4);
      await checkoutPage.setShopperDetails(shopperData.FR);

      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doOneyPayment(shopperData.FR);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeOneyRedirect();
    });

    test('Oney Fail', async ({ page }) => {
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU, 1);
      await checkoutPage.setShopperDetails(shopperData.FR);
      // SFRA 6 email setting flow is different
      if (environment.name.indexOf('v6') === -1) {
        await checkoutPage.setEmail();
      };
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doOneyPayment(shopperData.FR);
      await checkoutPage.completeCheckout();
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
    const result = await redirectShopper.doAmazonPayment(true, true, '3ds2_card');
    if(result != true){test.skip()};
    await cards.do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test.skip('Amazon Pay Express', async ({ page }) => {
    redirectShopper = new RedirectShopper(page);
    await checkoutPage.addProductToCart();
    await checkoutPage.navigateToCart(regionsEnum.EU);
    const result = await redirectShopper.doAmazonPayment(false);
    if(result != true){test.skip()};
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
    const result = await redirectShopper.doAmazonPayment(true, false);
    if(result != true){test.skip()};
    await checkoutPage.expectRefusal();
  });

 });
}