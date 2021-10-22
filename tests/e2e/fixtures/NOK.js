import CheckoutPage from "../pages/CheckoutPage";
import { doVippsPayment, doTrustlyPayment } from "../paymentFlows/redirectShopper"
import {regionsEnum} from "../data/enums";

const shopperData = require("../data/shopperData.json");

let checkoutPage;

fixture`NOK`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
      await t.maximizeWindow()
      checkoutPage = new CheckoutPage();
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.NO);
      await checkoutPage.setShopperDetails(shopperData.NO);
    });

  test('Vipps Success', async () => {
    await doVippsPayment(shopperData.NO);
    // can only be tested up to redirect. No success assertion
  });

  test('Vipps Fail', async t => {
    await doVippsPayment(false);
    await checkoutPage.expectRefusal();
  });

  test('Trustly Success', async () => {
    await doTrustlyPayment(shopperData.NO);
    await checkoutPage.expectSuccess();
  });

  test('Trustly Fail', async () => {
    await doTrustlyPayment(false);
    await checkoutPage.expectRefusal();
  });



