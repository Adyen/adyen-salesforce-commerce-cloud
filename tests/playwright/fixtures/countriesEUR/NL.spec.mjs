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

    test('iDeal Success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectNonRedirectSuccess();
    });

    /* Navigating back fails with SG, so skipping this.
    If it will always fail, is it even worth testing that flow
    for SG? */

    test.skip('iDeal with restored cart success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.completeCheckout();
      await checkoutPage.goBackAndSubmitShipping();
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.submitPayment();
      await checkoutPage.placeOrder();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('iDeal Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(false);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    /* Navigating back fails with SG, so skipping this.
    If it will always fail, also being super edge case,
    is it even worth testing that flow? */

    test.skip('iDeal with restored cart Fail', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.setEmail();
      await checkoutPage.submitPayment();
      await checkoutPage.goBackAndReplaceOrderDifferentWindow();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    test('SEPA Success', async ({ page }) => {
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
      await checkoutPage.setEmail();
      await pendingPayments.doGooglePayPayment();
    });
  });
}
