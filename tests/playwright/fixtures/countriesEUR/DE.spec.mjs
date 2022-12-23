import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { PaymentData } from '../../data/paymentData.mjs';

const paymentData = new PaymentData();
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
    });

    test('Klarna Success @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeKlarnaRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('Klarna Fail @quick', async ({ page }) => {
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
      await redirectShopper.completeKlarnaPayNowRedirect(true);
      await checkoutPage.expectSuccess();
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
      await redirectShopper.completeKlarnaAccountRedirect(true);
      await checkoutPage.expectSuccess();
    });

    test('Klarna Account Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doKlarnaAccountPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeKlarnaAccountRedirect(false);
      await checkoutPage.expectRefusal();
    });

    test('Giropay Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGiropayPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeGiropayRedirect(paymentData.GiroPay, true);
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('Giropay Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGiropayPayment(page);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeGiropayRedirect(paymentData.GiroPay, false);
      await checkoutPage.expectRefusal();
    });
  });
}
