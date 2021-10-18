import { regionsEnum } from "../data/enums";
import CheckoutPage from "../pages/CheckoutPage";
import {
  doCardPayment,
  do3Ds1Verification,
  do3Ds2Verification,
} from "../paymentFlows/cards";
const shopperData = require("../data/shopperData.json");
const cardData = require("../data/cardData.json") ;

let checkoutPage;

fixture`USD`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home?lang=${regionsEnum.US}`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
        // create full cart and go to checkout
        checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.US);

        // create user from specific country
        await checkoutPage.setShopperDetails(shopperData.US);

        await t.maximizeWindow()
    });



test('Card payment no 3DS success', async () => {
  await doCardPayment(cardData.noThreeDs);
  await checkoutPage.expectSuccess();
});

test('Card payment no 3DS failure', async () => {
  const cardDataInvalid = cardData.noThreeDs;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await checkoutPage.expectRefusal();
});

test('Card payment 3DS1 success', async () => {
  await doCardPayment(cardData.threeDs1);
  await do3Ds1Verification();
  await checkoutPage.expectSuccess();
});

test('Card payment 3DS1 failure', async () => {
  const cardDataInvalid = cardData.threeDs1;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds1Verification();
  await checkoutPage.expectRefusal();
});

test('Card payment 3DS2 success', async () => {
  await doCardPayment(cardData.threeDs2);
  await do3Ds2Verification();
  await checkoutPage.expectSuccess();
});

test('Card payment 3DS2 failure', async () => {
  const cardDataInvalid = cardData.threeDs2;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds2Verification();
  await checkoutPage.expectRefusal();
});

test('Card co-branded BCMC payment success', async () => {
  await doCardPayment(cardData.coBrandedBCMC);
  await do3Ds1Verification();
  await checkoutPage.expectSuccess();
})

test('Card co-branded BCMC payment failure', async () => {
  const cardDataInvalid = cardData.coBrandedBCMC;
  cardDataInvalid.expirationDate = '0150';
  await doCardPayment(cardDataInvalid);
  await do3Ds1Verification();
  await checkoutPage.expectRefusal();
})

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test('Affirm Success', async t => {

});

test('Affirm Fail', async t => {

});
