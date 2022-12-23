import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { PendingPayments } from '../../paymentFlows/pending.mjs';

let checkoutPage;
let redirectShopper;
let pendingPayments;
const shopperData = new ShopperData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR NL`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.NL);
    });

    test('iDeal Success @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('iDeal with restored cart success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.completeCheckout();
      environment.name != 'SG' ? await checkoutPage.goBackAndSubmitShipping()
        : await checkoutPage.goBack();
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.submitPayment();
      await checkoutPage.placeOrder();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('iDeal Fail @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(false);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    test('iDeal with restored cart Fail', async ({ page, context }) => {
      if (environment.name === 'SG') test.skip();
      // Skipping SG due to CSRF token validation

      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      // SFRA 6 email setting flow is different
      if (environment.name.indexOf("v6") === -1) {
        await checkoutPage.setEmail();
      }
      await checkoutPage.submitPayment();
      const checkoutURL = await checkoutPage.getLocation();
      await checkoutPage.placeOrder()

      const newPage = await context.newPage();
      newPage.goto(checkoutURL);

      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    test('SEPA Success @quick', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      await pendingPayments.doSEPAPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('bankTransfer_IBAN Success', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      await pendingPayments.doBankTransferPayment();
      await checkoutPage.completeCheckout();
      await pendingPayments.completeBankTransferRedirect();
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('Google Pay Success', async ({ page }) => {
      pendingPayments = new PendingPayments(page);
      // SFRA 6 email setting flow is different
      if (environment.name.indexOf("v6") === -1) {
        await checkoutPage.setEmail();
      }
      await pendingPayments.doGooglePayPayment();
    });
  });
}
