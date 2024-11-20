import { test } from '@playwright/test';
import { regionsEnum } from '../../data/enums.mjs';
import { environments } from '../../data/environments.mjs';
import { ShopperData } from '../../data/shopperData.mjs';
import { RedirectShopper } from '../../paymentFlows/redirectShopper.mjs';
import { PendingPayments } from '../../paymentFlows/pending.mjs';
import { PaymentData } from '../../data/paymentData.mjs';

let checkoutPage;
let redirectShopper;
let pendingPayments;
const paymentData = new PaymentData();
const shopperData = new ShopperData();

for (const environment of environments) {
  test.describe.parallel(`${environment.name} EUR NL`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.NL);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test.skip('iDeal Success @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect(true);
      await checkoutPage.expectNonRedirectSuccess();
    });

    test('iDeal with restored cart success', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.goBackAndSubmitShipping()
      await redirectShopper.doIdealPayment();
      await checkoutPage.submitPayment();
      await checkoutPage.placeOrder();
      await redirectShopper.completeIdealRedirect(true);
      await checkoutPage.expectNonRedirectSuccess();
    });

    test.skip('iDeal Fail @quick', async ({ page }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment();
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect(false);
      await checkoutPage.expectRefusal();
    });
  });

  test.describe.parallel(`${environment.name} EUR NL`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
      await checkoutPage.setShopperDetails(shopperData.NL);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });
    test('iDeal with restored cart Fail', async ({ page, context }) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doIdealPayment();
      await checkoutPage.submitPayment();
      const checkoutURL = await checkoutPage.getLocation();
      await checkoutPage.placeOrder()

      const newPage = await context.newPage();
      newPage.goto(checkoutURL);

      await redirectShopper.completeIdealRedirect(true);
      await checkoutPage.expectRefusal();
    });

    test.skip('SEPA Success @quick', async ({ page }) => {
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
      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await pendingPayments.doGooglePayPayment();
    });
  });

  test.describe.parallel(`${environment.name} EUR NL`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
    });
    test('Click to Pay renders @quick', async () => {
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU, 1, paymentData.ClickToPay.email);
        await checkoutPage.setShopperDetails(shopperData.NL);
        if (environment.name.indexOf('v5') !== -1) {
            test.skip();
        };
        await checkoutPage.expectClickToPay();
    });
  });
}

