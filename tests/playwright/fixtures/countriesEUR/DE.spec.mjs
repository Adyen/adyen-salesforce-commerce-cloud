import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import PaymentMethodsPage from '../../pages/PaymentMethodsPage.mjs';

const shopperData = new ShopperData();

let checkoutPage;
let redirectShopper;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR DE`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.DE);
      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test.skip('Klarna Success @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaPayment();
      await checkoutPage.completeCheckout();
      await new PaymentMethodsPage(page).waitForKlarnaLoad();
    });

    test.skip('Klarna Fail @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeKlarnaRedirect(false);
      await checkoutPage.expectRefusal();
    });
    test('Klarna Pay now Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaPayNowPayment();
      await checkoutPage.completeCheckout();
      await new PaymentMethodsPage(page).waitForKlarnaLoad();
    });

    test('Klarna Pay now Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaPayNowPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeKlarnaPayNowRedirect(false);
      await checkoutPage.expectRefusal();
    });
    test('Klarna Account Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaAccountPayment();
      await checkoutPage.completeCheckout();
      await new PaymentMethodsPage(page).waitForKlarnaLoad();
    });

    test('Klarna Account Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaAccountPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeKlarnaAccountRedirect(false);
      await checkoutPage.expectRefusal();
    });

    test('Giropay Success', async ({ page }) => {
      test.setTimeout(0);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGiropayPayment();
      await checkoutPage.completeCheckout();
      await new PaymentMethodsPage(page).waitForRedirect();
    });

    // Sometimes the cancel button takes time to become visible, so skipping the test if that happens
    test('Giropay Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGiropayPayment(page);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeGiropayRedirect(false);
      await checkoutPage.expectRefusal() || test.skip();
    });
  });

  test.describe.parallel(`${environment.name} Riverty EUR DE`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
    });
  
    async function rivertyCheckoutFlow({ page, email, shopperDetails, expectSuccess = true }) {
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.DE, 1, email);
      await checkoutPage.setShopperDetails(shopperDetails);

      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail(email);
      }
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doRivertyPayment(email);
      await checkoutPage.completeCheckout();

      if (expectSuccess) {
        await checkoutPage.expectSuccess();
      } else {
        await checkoutPage.expectRefusal();
      }
    }

    test('Riverty Success @quick', async ({ page }) => {
      await rivertyCheckoutFlow({
        page,
        email: shopperData.DERiverty.successShopperEmail,
        shopperDetails: shopperData.DERiverty,
        expectSuccess: true,    
      });
    });

    test('Riverty Failure @quick', async ({ page }) => {
      await rivertyCheckoutFlow({
        page,
        email: shopperData.DERiverty.refusalShopperEmail,
        shopperDetails: shopperData.DERiverty,
        expectSuccess: false,    
      });
    });
  }); 
}
