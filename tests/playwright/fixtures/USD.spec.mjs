import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { RedirectShopper } from '../paymentFlows/redirectShopper.mjs';
import { Cards } from '../paymentFlows/cards.mjs';
import { ShopperData } from '../data/shopperData.mjs';
import { CardData } from '../data/cardData.mjs';

const shopperData = new ShopperData();
const cardData = new CardData();

let checkoutPage;
let accountPage;
let cards;

let environment = environments[0];
// for (const environment of environments) {
test.describe.parallel(`${environment.name} USD`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${environment.urlExtension}`);

    checkoutPage = new environment.CheckoutPage(page);
    accountPage = new environment.AccountPage(page);
    cards = new Cards(page);
  });

  const goToBillingWithFullCartGuestUser = async () => {
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.US);
    await checkoutPage.setShopperDetails(shopperData.US);
  };

  const goToBillingWithFullCartLoggedInUser = async () => {
    await checkoutPage.addProductToCart();
    await checkoutPage.loginUser(shopperData.US);
    await checkoutPage.navigateToCheckout(regionsEnum.US);
    await checkoutPage.submitShipping();
  };

  test('my account add card no 3DS success', async ({ page }) => {
    accountPage = new environment.AccountPage(page);
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    await accountPage.addCard(cardData.noThreeDs);
    await accountPage.expectSuccess(cardData.noThreeDs);
    await accountPage.removeCard();
  });

  test('my account add card no 3DS failure', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    const cardDataInvalid = cardData.noThreeDs;
    cardDataInvalid.expirationDate = '0150';
    await accountPage.addCard(cardDataInvalid);
    await accountPage.expectFailure();
  });

  test('my account add card 3DS1 success', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    await accountPage.addCard(cardData.threeDs1);

    await cards.do3Ds1Verification();
    await accountPage.expectSuccess(cardData.threeDs1);
    await accountPage.removeCard();
  });

  test('my account add card 3DS1 failure', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    const cardDataInvalid = Object.assign({}, cardData.threeDs1);
    cardDataInvalid.expirationDate = '0150';
    await accountPage.addCard(cardDataInvalid);
    await cards.do3Ds1Verification();
    await accountPage.expectFailure();
  });

  test('my account add card 3DS2 success', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    await accountPage.addCard(cardData.threeDs2);
    await cards.do3Ds2Verification();
    await accountPage.expectSuccess(cardData.threeDs2);
    await accountPage.removeCard();
  });

  test('my account add card 3DS2 failure', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.expirationDate = '0150';
    await accountPage.addCard(cardDataInvalid);
    await cards.do3Ds2Verification();
    await accountPage.expectFailure();
  });

  test('my account remove card success', async () => {
    await accountPage.consent();
    await checkoutPage.loginUser(shopperData.USAccountTestUser);
    await accountPage.addCard(cardData.noThreeDs);
    await accountPage.removeCard();
    await accountPage.expectCardRemoval(cardData.noThreeDs);
  });

  test('Card payment no 3DS success', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.noThreeDs);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectSuccess();
  });

  test('Card payment no 3DS failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.noThreeDs);
    cardDataInvalid.expirationDate = '0150';
    await cards.doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectRefusal();
  });

  test('Card payment 3DS1 success', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.threeDs1);
    await checkoutPage.completeCheckout();
    await cards.do3Ds1Verification();
    await checkoutPage.expectSuccess();
  });

  test.skip('Card payment 3DS1 with restored cart success', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.threeDs1);
    await checkoutPage.completeCheckout();
    await checkoutPage.goBackAndSubmitShipping();
    await cards.doCardPayment(cardData.threeDs1);
    await checkoutPage.submitPayment();
    await checkoutPage.placeOrder();
    await cards.do3Ds1Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card payment 3DS1 failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.threeDs1);
    cardDataInvalid.expirationDate = '0150';
    await cards.doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await cards.do3Ds1Verification();
    await checkoutPage.expectRefusal();
  });

  test.skip('Card payment 3DS1 with restored cart failure', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.threeDs1);
    await checkoutPage.setEmail();
    await checkoutPage.submitPayment();
    await checkoutPage.goBackAndReplaceOrderDifferentWindow();
    await cards.do3Ds1Verification();
    await checkoutPage.expectRefusal();
  });

  test('Card payment 3DS2 success', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.threeDs2);
    await checkoutPage.completeCheckout();
    await cards.do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card payment 3DS2 failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.expirationDate = '0150';
    await cards.doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await cards.do3Ds2Verification();
    await checkoutPage.expectRefusal();
  });

  test('Card co-branded BCMC payment success', async () => {
    await goToBillingWithFullCartGuestUser();
    await cards.doCardPayment(cardData.coBrandedBCMC);
    await checkoutPage.completeCheckout();
    await cards.do3Ds1Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card co-branded BCMC payment failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.coBrandedBCMC);
    cardDataInvalid.expirationDate = '0150';
    await cards.doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await cards.do3Ds1Verification();
    await checkoutPage.expectRefusal();
  });

  test('Card logged in user 3DS2 oneClick test success', async () => {
    await goToBillingWithFullCartLoggedInUser();
    await cards.doCardPaymentOneclick(cardData.threeDs2);
    await checkoutPage.completeCheckout();
    await cards.do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card logged in user 3DS2 oneClick test failure', async () => {
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.cvc = '123';
    await goToBillingWithFullCartLoggedInUser();
    await cards.doCardPaymentOneclick(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await cards.do3Ds2Verification();
    await checkoutPage.expectRefusal();
  });

  test('Card logged in user co-branded BCMC oneClick test success', async () => {
    await goToBillingWithFullCartLoggedInUser();
    await cards.doCardPaymentOneclick(cardData.coBrandedBCMC);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectSuccess();
  });

  test.skip('PayPal Success', async () => {});

  test.skip('PayPal Fail', async () => {});

  test('Affirm Fail', async () => {
    await goToBillingWithFullCartGuestUser();
    await doAffirmPayment(shopperData.US);
    await checkoutPage.completeCheckout();
    await completeAffirmRedirect(false);
    await checkoutPage.expectRefusal();
  });
});
// }
