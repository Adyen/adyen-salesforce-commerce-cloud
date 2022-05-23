import { regionsEnum } from "../data/enums";
import { environments } from "../data/environments";
import {
  doAffirmPayment,
  completeAffirmRedirect,
} from "../paymentFlows/redirectShopper";
import {
  doCardPayment,
  do3Ds1Verification,
  do3Ds2Verification,
  doCardPaymentOneclick,
} from "../paymentFlows/cards";
const shopperData = require("../data/shopperData.json");
const cardData = require("../data/cardData.json") ;

let checkoutPage;
let accountPage;

for(const environment of environments) {
  fixture`${environment.name} USD`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach(async t => {
        await t.maximizeWindow();
        checkoutPage = new environment.CheckoutPage();
        accountPage = new environment.AccountPage();
      });

  const goToBillingWithFullCartGuestUser = async () => {
    await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.US);
    await checkoutPage.setShopperDetails(shopperData.US);
  }

  const goToBillingWithFullCartLoggedInUser = async () => {
    await checkoutPage.addProductToCart();
    await checkoutPage.loginUser(shopperData.US);
    await checkoutPage.navigateToCheckout(regionsEnum.US);
    await checkoutPage.submitShipping();
  }

test('my account add card no 3DS success', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  await accountPage.addCard(cardData.noThreeDs);
  await accountPage.expectSuccess(cardData.noThreeDs);
  await accountPage.removeCard();
})

test('my account add card no 3DS failure', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  const cardDataInvalid = cardData.noThreeDs;
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await accountPage.expectFailure();
})

test('my account add card 3DS1 success', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  await accountPage.addCard(cardData.threeDs1);
  await do3Ds1Verification();
  await accountPage.expectSuccess(cardData.threeDs1);
  await accountPage.removeCard();
})

test('my account add card 3DS1 failure', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  const cardDataInvalid = Object.assign({}, cardData.threeDs1);
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await do3Ds1Verification();
  await accountPage.expectFailure();
})

test('my account add card 3DS2 success', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  await accountPage.addCard(cardData.threeDs2);
  await do3Ds2Verification();
  await accountPage.expectSuccess(cardData.threeDs2);
  await accountPage.removeCard();
})

test('my account add card 3DS2 failure', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  const cardDataInvalid = Object.assign({}, cardData.threeDs2);
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await do3Ds2Verification();
  await accountPage.expectFailure();
})

test('my account remove card success', async () => {
  await accountPage.consent();
  await checkoutPage.loginUser(shopperData.USAccountTestUser);
  await accountPage.addCard(cardData.noThreeDs);
  await accountPage.removeCard();
  await accountPage.expectCardRemoval(cardData.noThreeDs);
})

  test('Card payment no 3DS success', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.noThreeDs);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectSuccess();
  });

  test('Card payment no 3DS failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.noThreeDs);
    cardDataInvalid.expirationDate = '0150';
    await doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectRefusal();
  });

  test('Card payment 3DS1 success', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.threeDs1);
    await checkoutPage.completeCheckout();
    await do3Ds1Verification();
    await checkoutPage.expectSuccess();
  });

  test.skip('Card payment 3DS1 with restored cart success', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.threeDs1);
    await checkoutPage.completeCheckout();
    await checkoutPage.goBackAndSubmitShipping();
    await doCardPayment(cardData.threeDs1);
    await checkoutPage.submitPayment();
    await checkoutPage.placeOrder();
    await do3Ds1Verification();
    await checkoutPage.expectSuccess();
  })

  test('Card payment 3DS1 failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.threeDs1);
    cardDataInvalid.expirationDate = '0150';
    await doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await do3Ds1Verification();
    await checkoutPage.expectRefusal();
  });

  test.skip('Card payment 3DS1 with restored cart failure', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.threeDs1);
    await checkoutPage.setEmail();
    await checkoutPage.submitPayment();
    await checkoutPage.goBackAndReplaceOrderDifferentWindow();
    await do3Ds1Verification();
    await checkoutPage.expectRefusal();
  })

  test('Card payment 3DS2 success', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.threeDs2);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card payment 3DS2 failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.expirationDate = '0150';
    await doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectRefusal();
  });

  test('Card co-branded BCMC payment success', async () => {
    await goToBillingWithFullCartGuestUser();
    await doCardPayment(cardData.coBrandedBCMC);
    await checkoutPage.completeCheckout();
    await do3Ds1Verification();
    await checkoutPage.expectSuccess();
  })

  test('Card co-branded BCMC payment failure', async () => {
    await goToBillingWithFullCartGuestUser();
    const cardDataInvalid = Object.assign({}, cardData.coBrandedBCMC);
    cardDataInvalid.expirationDate = '0150';
    await doCardPayment(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await do3Ds1Verification();
    await checkoutPage.expectRefusal();
  })

  test('Card logged in user 3DS2 oneClick test success', async () => {
    await goToBillingWithFullCartLoggedInUser();
    await doCardPaymentOneclick(cardData.threeDs2);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectSuccess();
  })

  test('Card logged in user 3DS2 oneClick test failure', async () => {
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.cvc = '123';
    await goToBillingWithFullCartLoggedInUser();
    await doCardPaymentOneclick(cardDataInvalid);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectRefusal();
  })

  test('Card logged in user co-branded BCMC oneClick test success', async () => {
    await goToBillingWithFullCartLoggedInUser();
    await doCardPaymentOneclick(cardData.coBrandedBCMC);
    await checkoutPage.completeCheckout();
    await checkoutPage.expectSuccess();
  })

  test.skip('PayPal Success', async t => {

  });

  test.skip('PayPal Fail', async t => {

  });

  test('Affirm Fail', async () => {
    await goToBillingWithFullCartGuestUser();
    await doAffirmPayment(shopperData.US);
    await checkoutPage.completeCheckout();
    await completeAffirmRedirect(false);
    await checkoutPage.expectRefusal();
  });
}
