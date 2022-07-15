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
  test.describe(`${environment.name} EUR NL`, () => {
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
      await checkoutPage.expectIdealSuccess();
    });

    test.skip('iDeal with restored cart success', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.completeCheckout();
      await checkoutPage.goBackAndSubmitShipping();
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.submitPayment();
      await checkoutPage.placeOrder();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectSuccess();
    });

    test('iDeal Fail', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await redirectShopper.doIdealPayment(false);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    test('iDeal with restored cart Fail', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await redirectShopper.doIdealPayment(true);
      await checkoutPage.setEmail();
      await checkoutPage.submitPayment();
      await checkoutPage.goBackAndReplaceOrderDifferentWindow();
      await redirectShopper.completeIdealRedirect();
      await checkoutPage.expectRefusal();
    });

    test('SEPA Success', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await pendingPayments.doSEPAPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('bankTransfer_IBAN Success', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await pendingPayments.doBankTransferPayment();
      await checkoutPage.completeCheckout();
      await pendingPayments.completeBankTransferRedirect();
      await checkoutPage.expectSuccess();
    });

    test('Google Pay Success', async () => {
      await checkoutPage.setShopperDetails(shopperData.NL);
      await checkoutPage.setEmail();
      await pendingPayments.doGooglePayPayment();
    });
  });
}
