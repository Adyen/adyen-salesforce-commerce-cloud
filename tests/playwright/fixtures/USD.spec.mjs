import {test, expect} from '@playwright/test';
import {regionsEnum} from '../data/enums.mjs';
import {environments} from '../data/environments.mjs';
import {RedirectShopper} from '../paymentFlows/redirectShopper.mjs';
import {Cards} from '../paymentFlows/cards.mjs';
import {ShopperData} from '../data/shopperData.mjs';
import {CardData} from '../data/cardData.mjs';
import PaymentMethodsPage from '../pages/PaymentMethodsPage.mjs';

const shopperData = new ShopperData();
const cardData = new CardData();

let checkoutPage;
let accountPage;
let cards;
let redirectShopper;

const goToBillingWithFullCartGuestUser = async (itemCount) => {
  await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.US, itemCount);
  await checkoutPage.setShopperDetails(shopperData.US);
};

const goToBillingWithFullCartLoggedInUser = async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  await checkoutPage.navigateToCheckout(regionsEnum.US);
  await checkoutPage.submitShipping();
};

for (const environment of environments) {
  test.describe.parallel(`${environment.name} USD`, () => {
    test.beforeEach(async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);

      await page.goto(`${environment.urlExtension}`);
      await goToBillingWithFullCartGuestUser();
      // SFRA 5 email setting flow is different
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('Card payment no 3DS success @quick', async () => {
      await cards.doCardPayment(cardData.noThreeDs);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('Card payment no 3DS failure @quick', async () => {
      const cardDataInvalid = Object.assign({}, cardData.noThreeDs);
      cardDataInvalid.expirationDate = '0150';
      await cards.doCardPayment(cardDataInvalid);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectRefusal();
    });

    test('Card payment no 3DS with adyen giving donation success @quick', async () => {
      await cards.doCardPayment(cardData.noThreeDs);
      await checkoutPage.completeCheckout();
      await checkoutPage.makeSuccessfulDonation();
    });

    test('Card payment 3DS2 success @quick', async () => {
      await cards.doCardPayment(cardData.threeDs2);
      await checkoutPage.completeCheckout();
      await cards.do3Ds2Verification();
      await checkoutPage.expectSuccess();
    });

    test('Card payment 3DS2 failure', async () => {
      const cardDataInvalid = Object.assign({}, cardData.threeDs2);
      cardDataInvalid.expirationDate = '0150';
      await cards.doCardPayment(cardDataInvalid);
      await checkoutPage.completeCheckout();
      await cards.do3Ds2Verification();
      await checkoutPage.expectRefusal();
    });

    test('PayPal Success @quick', async ({page}) => {
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doPayPalPayment(false, false, true);
      await checkoutPage.expectSuccess();
    });
  });

  test.describe.parallel(`${environment.name} USD`, () => {
    test.beforeEach(async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);
      await page.goto(`${environment.urlExtension}`);
    });

    test('GiftCard Only Success @quick', async () => {
      await goToBillingWithFullCartGuestUser();
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await cards.doGiftCardPayment(cardData.giftCard);
      await checkoutPage.placeOrder();
      await checkoutPage.expectSuccess();
    });

    test('GiftCard & Card Success @quick', async () => {
      await goToBillingWithFullCartGuestUser(3);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await cards.doGiftCardPayment(cardData.giftCard);
      await cards.doCardPayment(cardData.noThreeDs);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('Remove Gift Card', async ({page}) => {
      await goToBillingWithFullCartGuestUser(3);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await cards.doGiftCardPayment(cardData.giftCard);
      await page.locator('#giftCardCancelButton').click();
      // Wait for components to re-render after cancelling the giftcard
      await new Promise(r => setTimeout(r, 2000));

      await cards.doCardPayment(cardData.noThreeDs);
      await checkoutPage.completeCheckout();
      await checkoutPage.expectSuccess();
    });

    test('Gift Card Fail', async ({page, locale}) => {
      await goToBillingWithFullCartGuestUser(3);
      await cards.doGiftCardPayment(cardData.giftCard);
      await page.goto(`/s/RefArch/25720033M.html?lang=${locale}`);
      await page.locator('.add-to-cart').click();
      await checkoutPage.navigateToCheckout(regionsEnum.US);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.checkoutGuest.click();
      }
      await checkoutPage.submitShipping();
      await checkoutPage.expectGiftCardWarning();
    });
  });

  test.describe.parallel(`${environment.name} USD`, () => {
    test.beforeEach(async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);

      await page.goto(`${environment.urlExtension}`);
      await goToBillingWithFullCartGuestUser(5);
    });

    test('Affirm Fail', async ({page}) => {
      redirectShopper = new RedirectShopper(page);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await redirectShopper.doAffirmPayment(shopperData.US);
      await checkoutPage.completeCheckout();
      await redirectShopper.completeAffirmRedirect(false);
      await checkoutPage.expectRefusal();
    });

    test('CashApp Renders', async ({page}) => {
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
      await new PaymentMethodsPage(page).initiateCashAppPayment();
    });
  });

  test.describe(`${environment.name} USD Card logged in user `, () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);
      await goToBillingWithFullCartLoggedInUser();
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('3DS2 oneClick test success @quick', async () => {
      await cards.doCardPaymentOneclick(cardData.threeDs2);
      await checkoutPage.completeCheckoutLoggedInUser();
      await cards.do3Ds2Verification();
      await checkoutPage.expectSuccess();
    });

    test('3DS2 oneClick test failure', async () => {
      const cardDataInvalid = Object.assign({}, cardData.threeDs2);
      cardDataInvalid.cvc = '123';
      await cards.doCardPaymentOneclick(cardDataInvalid);
      await checkoutPage.completeCheckoutLoggedInUser();
      await cards.do3Ds2Verification();
      await checkoutPage.expectRefusal();
    });

    test('co-branded BCMC/Maestro oneClick test success', async () => {
      await cards.doCardPaymentOneclick(cardData.coBrandedBCMC);
      await checkoutPage.completeCheckoutLoggedInUser();
      await cards.do3Ds2Verification();
      await checkoutPage.expectSuccess();
    });
  });

  test.describe(`${environment.name} USD`, () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`${environment.urlExtension}`);

      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);

      await accountPage.consent();
      await checkoutPage.loginUser(shopperData.USAccountTestUser);
    });

    test('my account add card no 3DS success @quick', async () => {
      await accountPage.addCard(cardData.noThreeDs);
      await accountPage.expectSuccess(cardData.noThreeDs);
      await accountPage.removeCard(cardData.noThreeDs);
      await accountPage.expectCardRemoval(cardData.noThreeDs);
    });

    test('my account add card no 3DS failure', async () => {
      const cardDataInvalid = cardData.noThreeDs;
      cardDataInvalid.expirationDate = '0150';
      await accountPage.addCard(cardDataInvalid);
      await accountPage.expectFailure();
    });

    test('my account add card 3DS2 success @quick', async () => {
      await accountPage.addCard(cardData.threeDs2);
      await cards.do3Ds2Verification();
      await accountPage.expectSuccess(cardData.threeDs2);
      await accountPage.removeCard(cardData.threeDs2);
      await accountPage.expectCardRemoval(cardData.threeDs2);
    });

    test('my account add card 3DS2 failure', async () => {
      const cardDataInvalid = Object.assign({}, cardData.threeDs2);
      cardDataInvalid.expirationDate = '0150';
      await accountPage.addCard(cardDataInvalid);
      await cards.do3Ds2Verification();
      await accountPage.expectFailure();
    });
  });

  test.describe.parallel(`${environment.name} USD`, () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`${environment.urlExtension}`);
    });

    test('PayPal Express @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart();
      await checkoutPage.navigateToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doPayPalPayment(true, false, true);
      if (environment.name.indexOf('v5') !== -1) {
        await page.locator("button[value='place-order']").click();
        await page.locator(".order-thank-you-msg").isVisible();
      } else {
        await checkoutPage.expectSuccess();
      }
    });

    test('PayPal Express shipping change @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart();
      await checkoutPage.navigateToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doPayPalPayment(true, true, true);
      if (environment.name.indexOf('v5') !== -1) {
        await page.locator("button[value='place-order']").click();
        await page.locator(".order-thank-you-msg").isVisible();
      } else {
        await checkoutPage.expectSuccess();
      }
    });

    test('PayPal Express Cancellation @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart();
      await checkoutPage.navigateToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doPayPalPayment(true, false, false);
    });

    test('PayPal Express taxation @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart();
      await checkoutPage.navigateToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doPayPalPayment(true, false, true, true);
      if (environment.name.indexOf('v5') !== -1) {
        await page.locator("button[value='place-order']").click();
        await page.locator(".order-thank-you-msg").isVisible();
      } else {
        await checkoutPage.expectSuccess();
      }
      await expect(page.locator('.tax-total')).toContainText('$5.98');
    });

    test('Google Pay Express @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart();
      await checkoutPage.navigateToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGooglePayExpressPayment();
    });

    test('Google Pay Express PDP @quick', async ({page}) => {
      checkoutPage = new environment.CheckoutPage(page);
      await checkoutPage.addProductToCart(regionsEnum.US);
      redirectShopper = new RedirectShopper(page);
      await redirectShopper.doGooglePayExpressPayment();
    });
  });
}
