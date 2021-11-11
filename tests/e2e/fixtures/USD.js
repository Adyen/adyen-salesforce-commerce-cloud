import { regionsEnum } from "../data/enums";
import { doAffirmPayment } from "../paymentFlows/redirectShopper";
import CheckoutPage from "../pages/CheckoutPage";
import AccountPage from "../pages/AccountPage";
import {
  doCardPayment,
  do3Ds1Verification,
  do3Ds2Verification,
  doCardPaymentOneclick,
} from "../paymentFlows/cards";
const shopperData = require("../data/shopperData.json");
const cardData = require("../data/cardData.json") ;

const checkoutPage = new CheckoutPage();
const accountPage = new AccountPage();

fixture`USD`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
        await t.maximizeWindow()
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
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  await accountPage.addCard(cardData.noThreeDs);
  await accountPage.expectSuccess(cardData.noThreeDs);
  await accountPage.removeCard();
})

test('my account add card no 3DS failure', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  const cardDataInvalid = cardData.noThreeDs;
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await accountPage.expectFailure(cardData.noThreeDs);
})

test('my account add card 3DS1 success', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  await accountPage.addCard(cardData.threeDs1);
  await do3Ds1Verification();
  await accountPage.expectSuccess(cardData.threeDs1);
  await accountPage.removeCard();
})

test('my account add card 3DS1 failure', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  const cardDataInvalid = cardData.threeDs1;
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await do3Ds1Verification();
  await accountPage.expectFailure(cardData.threeDs1);
})

test('my account add card 3DS2 success', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  await accountPage.addCard(cardData.threeDs2);
  await do3Ds2Verification();
  await accountPage.expectSuccess(cardData.threeDs2);
  await accountPage.removeCard();
})

test('my account add card 3DS2 failure', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  const cardDataInvalid = cardData.threeDs2;
  cardDataInvalid.expirationDate = '0150';
  await accountPage.addCard(cardDataInvalid);
  await do3Ds2Verification();
  await accountPage.expectFailure(cardData.threeDs2);
})

test('my account remove card success', async () => {
  await checkoutPage.addProductToCart();
  await checkoutPage.loginUser(shopperData.US);
  await accountPage.addCard(cardData.noThreeDs);
  await accountPage.removeCard();
  await accountPage.expectCardRemoval(cardData.noThreeDs);
})

test('Card payment no 3DS success', async () => {
  await goToBillingWithFullCartGuestUser();
  await doCardPayment(cardData.noThreeDs);
  await checkoutPage.expectSuccess();
});

test('Card payment no 3DS failure', async () => {
  await goToBillingWithFullCartGuestUser();
  const cardDataInvalid = cardData.noThreeDs;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await checkoutPage.expectRefusal();
});

test('Card payment 3DS1 success', async () => {
  await goToBillingWithFullCartGuestUser();
  await doCardPayment(cardData.threeDs1);
  await do3Ds1Verification();
  await checkoutPage.expectSuccess();
});

test('Card payment 3DS1 failure', async () => {
  await goToBillingWithFullCartGuestUser();
  const cardDataInvalid = cardData.threeDs1;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds1Verification();
  await checkoutPage.expectRefusal();
});

test('Card payment 3DS2 success', async () => {
  await goToBillingWithFullCartGuestUser();
  await doCardPayment(cardData.threeDs2);
  await do3Ds2Verification();
  await checkoutPage.expectSuccess();
});

test('Card payment 3DS2 failure', async () => {
  await goToBillingWithFullCartGuestUser();
  const cardDataInvalid = cardData.threeDs2;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds2Verification();
  await checkoutPage.expectRefusal();
});

test('Card co-branded BCMC payment success', async () => {
  await goToBillingWithFullCartGuestUser();
  await doCardPayment(cardData.coBrandedBCMC);
  await do3Ds1Verification();
  await checkoutPage.expectSuccess();
})

test('Card co-branded BCMC payment failure', async () => {
  await goToBillingWithFullCartGuestUser();
  const cardDataInvalid = cardData.coBrandedBCMC;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds1Verification();
  await checkoutPage.expectRefusal();
})

test('Card logged in user 3DS2 oneClick test success', async () => {
  await goToBillingWithFullCartLoggedInUser();
  await doCardPaymentOneclick(cardData.threeDs2);
  await do3Ds2Verification();
  await checkoutPage.expectSuccess();
})

test('Card logged in user 3DS2 oneClick test failure', async () => {
  const cardDataInvalid = cardData.threeDs2;
  cardDataInvalid.cvc = '123';
  await goToBillingWithFullCartLoggedInUser();
  await doCardPaymentOneclick(cardDataInvalid);
  await do3Ds2Verification();
  await checkoutPage.expectRefusal();
})

test('Card logged in user co-branded BCMC oneClick test success', async () => {
  await goToBillingWithFullCartLoggedInUser();
  await doCardPaymentOneclick(cardData.coBrandedBCMC);
  await checkoutPage.expectSuccess();
})

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test.skip('Affirm Success', async t => {
    await goToBillingWithFullCartGuestUser();
    await doAffirmPayment(shopperData.US, true);
    await checkoutPage.expectSuccess();
});

test.skip('Affirm Fail', async t => {
    await goToBillingWithFullCartGuestUser();
    await doAffirmPayment(shopperData.US,false);
    await checkoutPage.expectRefusal();
});
